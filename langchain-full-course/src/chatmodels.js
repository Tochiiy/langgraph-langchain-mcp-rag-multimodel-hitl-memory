import "dotenv/config";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ChatCerebras } from "@langchain/cerebras";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { initChatModel } from "langchain";




// const model = await initChatModel("chatcerebras:llama-3.3-70b");
// const model = await initChatModel("azure_openai:gpt-4.1");

// // free 1M
// const llm= new ChatFireworks({
//         model: "accounts/fireworks/models/deepseek-v3p1",
//         temperature: 0.7,
//         apiKey: process.env.FIRE_WORKS_API_KEY,
//       });

  

// 200K
const llm = new ChatCerebras({
    model: "llama-3.3-70b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.CEREBRAS_API_KEY
});



// ===MESSAGE TYPES IN LANGCHAIN======

// System message
// HumanMessage
// AIMessage
// ToolMessage


const aiMsg = await llm.invoke([
   
    new SystemMessage(`Your are helpful ai assistant respond the user only in English.
        RULES
        - if the user provide or input a message which is not in English language,
           say eg: sorry I dont understand this language
        `),

    
        new HumanMessage('Bonjour,comment ca va')
        // array is 20K tokens
   
]);


console.log(aiMsg?.content)


// // ADD SIMple Chat History : CHAT HISTORY 