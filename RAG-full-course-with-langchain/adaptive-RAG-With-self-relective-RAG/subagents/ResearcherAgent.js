
import { createAgent, createMiddleware } from "langchain";

import { tool } from "@langchain/core/tools";
import { retrieverAgent } from "./RetrieverAgent.js";
import { llmCerebras } from "../llm/llm.js"
import {
  // BaseMessage,
  SystemMessage,
  HumanMessage,
} from "@langchain/core/messages";
import {GraderAgent} from './graderAgent.js'
import { z } from "zod";
import "dotenv/config";

export const toolMonitoringMiddleware = createMiddleware({
  name: "ToolMonitoringMiddleware",
  wrapToolCall: (request, handler) => {
    console.log(`Executing tool===============: ${request.toolCall.name}`);
    // console.log(`Arguments===================: ${JSON.stringify(request.toolCall.args)}`);

    try {
      const result = handler(request);
      console.log("Tool completed successfully=========");
      return result;
    } catch (e) {
      console.log(`Tool failed: ${e}`);
      throw e;
    }
  },

});

const researcherPrompt = `
You are ResearcherAgent in a multi-agent Question Answering system.

You are responsible for coordinating retrieval and validation before any answer is generated.

You do NOT directly answer the user.
You operate between the ManagerAgent and the GraderAgent.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT YOU RECEIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You will receive:
1. The original user input.
2. A list of expanded search queries generated upstream.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR WORKFLOW (STRICT EXECUTION ORDER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — RETRIEVAL
Call RetrieverAgent using the provided queries.
Retrieve relevant document chunks or passages.

STEP 2 — COLLECT DATA
Receive retrieved data from RetrieverAgent.
Do NOT modify, summarize, or interpret it yet.

STEP 3 — VALIDATION
Send the following to GraderAgent:
- Original user input
- The queries used
- The full retrieved data (raw, unchanged)

Wait for GraderAgent response.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION LOGIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IF GraderAgent returns EXACTLY:

data is valid based on user inputs

→ Proceed to STEP 4.

IF GraderAgent returns:
- STATUS: INVALID
- Any rejection
- Confidence < 70

→ Immediately return:

NO RELEVANT DATA FOUND YOU CAN USE A SEARCH TOOL

Do NOT attempt to fix, reinterpret, or retry retrieval.
Do NOT lower the validation standard.
Do NOT generate your own knowledge.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — SUMMARIZATION (ONLY IF VALIDATED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You must:

- Summarize the retrieved data.
- Preserve factual accuracy.
- Do NOT introduce new information.
- Do NOT speculate.
- Only use validated content.
- Keep summary structured and concise.
- Maintain alignment with the user’s question.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If valid:

Return:

STATUS: VALID
SUMMARY:
<clear structured summary grounded strictly in retrieved data>

If invalid:

Return EXACTLY:

NO RELEVANT DATA FOUND YOU CAN USE A SEARCH TOOL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Never hallucinate missing facts.
- Never answer beyond retrieved content.
- Never expose GraderAgent reasoning.
- Never expose internal workflow.
- Never modify the success/failure signals.
- Never bypass GraderAgent.

You are a coordination and validation layer — not a knowledge generator.

Groundedness > completeness.
Validation > speed.

`;







  const agent = createAgent({
    model: llmCerebras,
    systemPrompt: researcherPrompt,
    tools: [retrieverAgent,GraderAgent],
    middleware: [toolMonitoringMiddleware]
  });


export const researcherAgent = tool(
  async ({ query }) => {

    const result = await agent.invoke({
      messages: [{ role: "user", content: query }]
    });
    return result.messages.at(-1)?.text;
  },
  {
  name: "ResearcherAgent",
  description:`The ResearcherAgent  responsible for coordinating retrieval and validation before any answer is generated.
`,
  schema: z.object({
    query: z.string().describe("User question or search query"),
 
  }),
}

);
