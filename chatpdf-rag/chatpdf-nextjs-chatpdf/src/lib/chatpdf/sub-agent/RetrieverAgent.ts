import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
    // BaseMessage,
    SystemMessage,
    HumanMessage,
} from "@langchain/core/messages";
import { createAgent } from "langchain";

import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";

import "dotenv/config";
import { llmCerebras } from "@/lib/llm/llm";
import { retrieverAgentPrompt } from "@/lib/prompts/RetrieverAgent";
import { retrieverTool } from "@/lib/tools/RetrieverTool";
import { trackExecTool } from "@/lib/middleware/trackExecTool";






const  agent= createAgent({
    model:llmCerebras,
  systemPrompt: retrieverAgentPrompt,
  tools: [retrieverTool],
  middleware: [trackExecTool()],
});

export const retrieverAgent = tool(
  async ({ query,pdfId }) => {

    const result = await agent.invoke({
      messages: [{ role: "user", content: query },{ role: "user", content: `use this pdf id 
        to retrieve data with retriever tool pdfId=${pdfId}` }]
    });
    return result.messages.at(-1)?.text;
  },
  {
  name: "Retriever Agent",
  description:
    "Retrieves the most relevant document chunks from the vector database based on the user's query.",
  schema: z.object({
    query: z.string().describe("User question or search query"),
    pdfId: z.string().describe("You should provide a pdfId to retriever gent"),

  }),
}

);
