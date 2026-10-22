import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

async function main() {
  const server = new McpServer({
    name: "ben-mcp-sampling",
    version: "1.0.0",
  });

  // 🛠️ Tool with Sampling
  server.registerTool(
    "analyze-code",
    {
      description: "Analyze code using LLM reasoning",
      inputSchema: {
        code: z.string(),
      },
    },
    async ({ code }, { sampling }) => {
      // 🔥 THIS is the magic
      const result = await sampling.createMessage({
        messages: [
          {
            role: "system",
            content: "You are a senior engineer. Be concise.",
          },
          {
            role: "user",
            content: `Analyze this code:\n\n${code}`,
          },
        ],
        maxTokens: 300,
      });

      return {
        content: [
          {
            type: "text",
            text: result.content[0].text,
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("✅ MCP with Sampling running");
}

main().catch(console.error);