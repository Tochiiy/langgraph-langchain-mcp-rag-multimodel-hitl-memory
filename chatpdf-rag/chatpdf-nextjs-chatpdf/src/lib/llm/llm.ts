
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ChatCerebras } from "@langchain/cerebras";



export const llmFireworks= new ChatFireworks({
        model: "accounts/fireworks/models/deepseek-v3p1",
        temperature: 0.7,
        apiKey: process.env.FIRE_WORKS_API_KEY,
      });


export const llmCerebras = new ChatCerebras({
    model: "llama-3.3-70b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.CEREBRAS_API_KEY
});
