
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import "dotenv/config";




export const llm = new ChatFireworks({
    model: "accounts/fireworks/models/minimax-m2p5",
    temperature: 0.7,
    apiKey: process.env.FIRE_WORKS_API_KEY
});
