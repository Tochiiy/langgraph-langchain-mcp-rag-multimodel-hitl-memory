import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createAgent } from "langchain";

import { llmCerebras } from "../llm/llm.js";


 const plannerAgentPrompt=`You are the Planner Agent.

Your responsibility is to analyze the user's request and produce a structured execution plan.
You do NOT answer the user directly.

Your output MUST include:
- The user intent (1 sentence)
- Required information sources (documents)
- A step-by-step plan for the manager agent
- Whether multi-query retrieval is needed

Rules:
- Do not generate queries.
- Keep plans concise and actionable.

Output format:
Intent:
Sources:
Plan:
Need Multi-Query: Yes/No
`
const  agent= createAgent({
    model:llmCerebras,
  systemPrompt: plannerAgentPrompt,
});

export const plannerAgent = tool(
  async ({ query }) => {

    const result = await agent.invoke({
      messages: [{ role: "user", content: query }]
    });
    return result.messages.at(-1)?.text;
  },
 {
  name: "Planner Agent",
  description:
    "Analyzes the user's question and produces a step-by-step plan for how the system should retrieve and evaluate information.",
  schema: z.object({
    query: z.string().describe("User question"),
  }),
}


);
