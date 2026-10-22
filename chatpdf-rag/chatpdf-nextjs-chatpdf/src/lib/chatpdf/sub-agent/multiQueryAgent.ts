import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createAgent } from "langchain";


import "dotenv/config";
import { llmCerebras } from "@/lib/llm/llm";
import { retrieverAgentPrompt } from "@/lib/prompts/RetrieverAgent";
import { retrieverTool } from "@/lib/tools/RetrieverTool";
import { multiQueryAgentPrompt } from "@/lib/prompts/multiQueryAgent";






const  agent= createAgent({
    model:llmCerebras,
  systemPrompt: multiQueryAgentPrompt,
});

export const multiQueryAgent = tool(
  async ({ query }) => {

    const result = await agent.invoke({
      messages: [{ role: "user", content: query }]
    });
    return result.messages.at(-1)?.text;
  },
  {
  name: "Multi Query Agent",
  description:
    "Generates multiple semantically diverse search queries from the user's question to improve document retrieval.",
  schema: z.object({
    query: z.string().describe("Original user question"),
  }),
}


);
