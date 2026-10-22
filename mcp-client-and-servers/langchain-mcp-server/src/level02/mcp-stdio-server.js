import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { weatherToolInput,
    weatherTool} from './../level01/tools/weatherTool.js'


// The Core Difference

// ✅ Tools are called
// ⚠️ Resources are read : think of them as the Context Layer
// ⚠️ Prompts are applied

async function main() {
  const server = new McpServer({
    name: "ben-mcp-stdio",
    version: "1.0.0",
  });




  // ============================================================
  // 📁 RESOURCE: The Database Schema (Context Layer)
  // This lets the AI "see" the table structure without asking.
  // ============================================================

   server.registerTool(
    "weather",
    weatherToolInput,
    weatherTool
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

  



 



  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("✅ MCP STDIO Server with tools, resources, prompts running");
}

main().catch(console.error);