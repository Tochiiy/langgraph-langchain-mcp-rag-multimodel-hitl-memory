

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { z } from "zod";
import cors from "cors";

import { rateLimit } from 'express-rate-limit';
import { validateApiKey } from './utils.js'
import { retrieverTool, queryTransformerTool } from './tools.js'
import { llm } from './llm.js'
import "dotenv/config";









async function main() {
    const app = express();

    app.disable('x-powered-by');


    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 100 // limit each IP to 100 requests per window
    });
    app.use("/mcp", limiter);


    app.use(cors({ origin: 'http://localhost:8000' }));



    const jsonParser = express.json();

    // 1. Initialize the singleton MCP Server
    const server = new McpServer({
        name: "chat-over-document-mcp",
        version: "1.0.0",
    });



    // 2. Register Tools
    server.registerTool('retriever', {
        description: "Retrieve a list a user from vector db",
        inputSchema: {
            queries: z.array(z.string()).describe("array of input to retrieve data in vector db"),
        },
    }, retrieverTool)

    server.registerTool('queryTransformer',
        {
            description: "This allows to generate  3 version of the userInput for better semantic retrieval",
            inputSchema: {
                query: z
                    .string()
                    .describe("user input to transform"),
            },
        }, queryTransformerTool)



    // 1. Store metadata instead of just the transport
    const transports = new Map();

    const SESSION_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // Run cleanup every 5 minutes

  app.all("/mcp", validateApiKey, jsonParser, async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];
    let transport; // Track the transport object directly

    if (sessionId && transports.has(sessionId)) {
        // 1. Existing Session
        const sessionRecord = transports.get(sessionId);
        sessionRecord.lastSeen = Date.now();
        transport = sessionRecord.transport;
    } else if (isInitializeRequest(req.body)) {
        // 2. New Session
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
                // This still runs to populate the Map for FUTURE requests
                transports.set(id, {
                    transport,
                    lastSeen: Date.now()
                });
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
        // No need to fetch from Map here; 'transport' is already defined above
    } else {
        return res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32001, message: "Session timed out or invalid" },
            id: null
        });
    }

    // 3. Process the request
    // We call handleRequest on the 'transport' variable we assigned in either block
    try {
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error("Transport Error:", error);
        res.status(500).end();
    }
});

    // 2. The "Smart" Reaper
    setInterval(() => {
        const now = Date.now();
        let evictedCount = 0;

        for (const [id, record] of transports) {
            // If the session hasn't been active for the TTL duration
            if (now - record.lastSeen > SESSION_TTL) {
                // Important: Explicitly close the transport to free internal buffers/listeners
                record.transport.close?.();
                transports.delete(id);
                evictedCount++;
            }
        }

        if (evictedCount > 0) {
            console.log(`Cleanup: Removed ${evictedCount} stale sessions. Current count: ${transports.size}`);
        }
    }, CLEANUP_INTERVAL);


    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`✅ MCP  Server Running URL: http://localhost:${PORT}/mcp`);
    });
}

main().catch(console.error);
