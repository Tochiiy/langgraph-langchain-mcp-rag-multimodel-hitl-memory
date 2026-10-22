import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createAgent } from "langchain";
import "dotenv/config";
import { llmCerebras, llmFireworks } from "@/lib/llm/llm";
import { retrieverAgentPrompt } from "@/lib/prompts/RetrieverAgent";
import { searchTool } from "@/lib/tools/search";
import { criticAgentPrompt } from "@/lib/prompts/CriticAgent";






const agent = createAgent({
    model:llmFireworks,
  systemPrompt: criticAgentPrompt,
  tools: [searchTool]
});
export const criticAgent = tool(
  async ({ query, retrievedContent }) => {
    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content: `
You are a Critic Agent.

User Question:
${query}

Retrieved Content:
${retrievedContent}

Task:
- Evaluate whether the retrieved content is relevant to the user question.
- Check for accuracy and completeness.
- Identify missing information or contradictions.
- Decide whether the system can proceed or needs more retrieval.

Respond with:
- Relevance: High | Medium | Low
- Validated Facts:
- Gaps or Issues:
- Recommendation: Proceed | Retrieve More | Use Web Search
          `,
        },
      ],
    });

    return result.messages.at(-1)?.text;
  },
  {
    name: "Critic Agent",
    description:
      "Evaluates retrieved content for relevance, accuracy, and completeness with respect to the user's question.",
    schema: z.object({
      query: z.string().describe("User question"),
      retrievedContent: z
        .string()
        .describe("Content retrieved from documents or external search"),
    }),
  }
);

