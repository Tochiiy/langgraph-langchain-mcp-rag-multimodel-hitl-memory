import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createAgent } from "langchain";
import { llmCerebras } from "../llm/llm.js";

 const multiQueryAgentPrompt=`You are the Multi Query Agent.

Your job is to generate multiple high-quality search queries
from the user's original question using step-back prompting.

Goals:
- Improve recall in vector retrieval.
- Cover paraphrases, broader context, and key concepts.
- Avoid adding new assumptions.

Rules:
- Generate exactly 3 queries.
- Queries must be semantically different but intent-aligned.
- Do NOT answer the user.
- Do NOT retrieve data.

Output format:
Query 1:
Query 2:
Query 3:
`


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
  name: "MultiQueryAgent",
  description:
    "Generates multiple semantically diverse search queries from the user's question to improve document retrieval.",
  schema: z.object({
    query: z.string().describe("Original user question"),
  }),
}


);
