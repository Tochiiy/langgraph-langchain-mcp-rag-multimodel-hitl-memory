
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";



export const llmFireworks= new ChatFireworks({
        model: "accounts/fireworks/models/deepseek-v3p1",
        temperature: 0.7,
        apiKey: process.env.FIRE_WORKS_API_KEY,
      });


