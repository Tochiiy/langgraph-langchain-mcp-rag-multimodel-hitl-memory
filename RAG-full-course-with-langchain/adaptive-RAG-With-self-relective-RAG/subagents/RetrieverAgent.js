import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createAgent } from "langchain";


import { llmCerebras } from "../llm/llm.js";
import { retrieverTool } from "../tools/retrieverTool.js"
import "dotenv/config";



const retrieverAgentPrompt = `You are the Retriever Agent.

Your responsibility is to retrieve relevant document chunks
from the vector database using the retriever tool.

Rules:
- Use ONLY the retriever tool.
- Do not summarize or interpret content.
- Do not hallucinate missing text.
- Retrieve the top relevant chunks per query.

Output MUST include:
- Retrieved text chunks
- Associated metadata (document name, page, chunk id if available)

If no relevant data is found:
- Explicitly say: "No relevant document content found."
`



const agent = createAgent({
  model: llmCerebras,
  systemPrompt: retrieverAgentPrompt,
  tools: [retrieverTool],
});

export const retrieverAgent = tool(
  async ({ query }) => {

    const result = await agent.invoke({
      messages: [{ role: "user", content: query }]
    });
    return result.messages.at(-1)?.text;
  },
  {
    name: "RetrieverAgent",
    description:
      "Retrieves the most relevant document chunks from the vector database based on the user's query.",
    schema: z.object({
      query: z.string().describe("User question or search query"),
      pdfId: z.string().describe("You should provide a pdfId to retriever gent"),

    }),
  }

);
