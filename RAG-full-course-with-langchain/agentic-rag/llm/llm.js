import { ChatCerebras } from "@langchain/cerebras";
import "dotenv/config";


// // free 200K
export const llmCerebras = new ChatCerebras({
    model: "qwen-3-32b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.CEREBRAS_API_KEY
});