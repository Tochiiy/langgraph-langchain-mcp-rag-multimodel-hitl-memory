import { createMiddleware, AIMessage } from "langchain";
import { createAgent,initChatModel } from "langchain";
import { ChatCerebras } from "@langchain/cerebras";
import "dotenv/config";

const model = new ChatCerebras({
  model: "llama-3.3-70b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,

});

/**
 * 
 * @param {string[]} bannedKeywords 
 * @returns 
 */
const contentFilterMiddleware = (bannedKeywords) => {
  const keywords = bannedKeywords.map(kw => kw.toLowerCase());

  return createMiddleware({
    name: "ContentFilterMiddleware",
    beforeAgent: {
      hook: (state) => {
        // Get the first user message
        if (!state.messages || state.messages.length === 0) {
          return;
        }

        const firstMessage = state.messages[0];
        if (firstMessage.type !== "human") {
          return;
        }

        const content = firstMessage.content.toString().toLowerCase();

        // Check for banned keywords
        for (const keyword of keywords) {

          if (content.includes(keyword)) {
            // Block execution before any processing
            return {
              messages: [
                new AIMessage(
                  "I cannot process requests containing inappropriate content. Please rephrase your request."
                )
              ],
              jumpTo: "end",
            };
          }
        }

        return;
      },
      canJumpTo: ['end']
    }
  });
};





const safetyGuardrailMiddleware =async () => {
  const safetyModel = await initChatModel("cerebras:qwen-3-32b");

  return createMiddleware({
    name: "SafetyGuardrailMiddleware",
    afterAgent: {
      hook: async (state) => {
        // Get the final AI response
        if (!state.messages || state.messages.length === 0) {
          return;
        }

        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.type!== "ai") {
          return;
        }

        // Use a model to evaluate safety
        const safetyPrompt = `Evaluate if this response is safe and appropriate.
        Respond with only 'SAFE' or 'UNSAFE'.

        Response: ${lastMessage.content.toString()}`;

        const result = await safetyModel.invoke([
          { role: "user", content: safetyPrompt }
        ]);

        if (result.content.toString().includes("UNSAFE")) {
          return {
            messages: [
              new AIMessage(
                "I cannot provide that response. Please rephrase your request."
              )
            ],
            jumpTo: "end",
          };
        }

        return;
      },
      canJumpTo: ['end']
    }
  });
};



const agent = createAgent({
  model,
  middleware: [
    contentFilterMiddleware(["hack", "exploit", "malware"]),
    safetyGuardrailMiddleware()
  ],
});

// This request will be blocked before any processing
const agentOutput = await agent.invoke({
  messages: [{ role: "user", content: "How do I make explosives?" }]
});



const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content

console.log(aiResponse)
