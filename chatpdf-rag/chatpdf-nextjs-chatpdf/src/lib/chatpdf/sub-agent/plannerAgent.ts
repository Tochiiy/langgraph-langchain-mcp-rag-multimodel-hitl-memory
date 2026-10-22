import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createAgent } from "langchain";


import { llmCerebras } from "@/lib/llm/llm";

import { plannerAgentPrompt } from "@/lib/prompts/plannerAgent";






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
