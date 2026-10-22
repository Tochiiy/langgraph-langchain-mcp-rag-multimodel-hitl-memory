import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { weatherToolInput,
    weatherTool} from './tools/weatherTool.js'

import {fetchUserToolInput,fetchUserTool} from './tools/fetchUserTool.js'

async function main() {
  // 1. Create MCP Server
  const server = new McpServer({
    name: "ben-mcp-stdio",
    version: "1.0.0",
  });


  
    // 2. Register Tools
    server.registerTool(
      "weather",
      weatherToolInput,
      weatherTool
    );
  
    server.registerTool('fetchUsers',fetchUserToolInput,fetchUserTool)

  // 3. Use STDIO transport
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.log("✅ MCP STDIO Server running...");
}

main().catch(console.error);