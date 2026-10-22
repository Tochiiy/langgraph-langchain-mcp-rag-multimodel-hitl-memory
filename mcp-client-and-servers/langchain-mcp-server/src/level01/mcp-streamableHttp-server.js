

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  weatherToolInput,
  weatherTool
} from './tools/weatherTool.js'

import { fetchUserToolInput, fetchUserTool } from './tools/fetchUserTool.js'

import { rateLimit } from 'express-rate-limit';
import "dotenv/config";

const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};




async function main() {
  const app = express();

  app.disable('x-powered-by');


  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100 // limit each IP to 100 requests per window
  });
  app.use("/mcp", limiter);


  // import cors from "cors";
  // app.use(cors({ origin: 'https://your-trusted-frontend.com' }));



  const jsonParser = express.json();

  // 1. Initialize the singleton MCP Server
  const server = new McpServer({
    name: "ben-mcp-server-v1",
    version: "1.0.0",
  });



  // 2. Register Tools
  server.registerTool(
    "weather",
    weatherToolInput,
    weatherTool
  );

  server.registerTool('fetchUsers', fetchUserToolInput, fetchUserTool)




  server.registerResource(
    "user-profile",
    "user://profile",
    {
      description: "Basic user profile info",
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify({
              name: "Ben",
              role: "AI Engineer",
              focus: ["RAG", "Agents", "MCP"],
            }),
          },
        ],
      };
    }
  );


  // Resources must be addressable
  // must be unique
  server.registerResource(
    "db-schema",
    "db://main/schema",
    { description: "The SQL schema for the main production database" },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: "application/sql",
        text: `
          CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT UNIQUE, created_at TIMESTAMP);
          CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), amount DECIMAL);
        `
      }]
    })
  );





  server.registerPrompt(
    "sql-report-helper", // Name of the prompt
    {
      topic: z.string().describe("What the report is about (e.g., 'user spending')"),
    },
    (args) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are an expert Data Analyst. 
            Please generate a high-quality SQL query regarding: ${args.topic}.
            Use the available database schema resource to ensure column names are correct.
            Provide a brief explanation of how the query works.`
          }
        }
      ]
    })
  );
  // 3. Session Management for Streamable HTTP
  // This prevents the -32001 timeout by tracking active client sessions
  const transports = new Map();

  // 4. Unified MCP Endpoint
  app.all("/mcp", validateApiKey, jsonParser, async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];
    let transport;

    if (sessionId && transports.has(sessionId)) {
      // Handle subsequent requests for existing session
      transport = transports.get(sessionId);
    } else if (isInitializeRequest(req.body)) {
      // Start a brand new session
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports.set(id, transport);
          console.log(`MCP Session Started: ${id}`);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          transports.delete(transport.sessionId);
          console.log(`MCP Session Closed: ${transport.sessionId}`);
        }
      };

      await server.connect(transport);
    } else {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Session timed out or invalid" },
        id: null
      });
    }

    // Process the request through the transport
    await transport.handleRequest(req, res, req.body);
  });




  // Your transports Map grows every time a session starts.
  //  If a client disconnects unexpectedly without a clean "close," 
  // you’ll leak memory. Add a stale-session reaper:
  // Every 10 minutes, clear transports that haven't been active
setInterval(() => {
  const now = Date.now();
  for (const [id, transport] of transports) {
    if (transports.size > 100) transports.delete(id); 
  }
}, 600000);



  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`
✅ MCP Weather Server Running
URL: http://localhost:${PORT}/mcp
    `);
  });
}

main().catch(console.error);
