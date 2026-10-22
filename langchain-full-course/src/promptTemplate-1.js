import "dotenv/config";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ChatCerebras } from "@langchain/cerebras";
import z from "zod";
import { tool } from "@langchain/core/tools";
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts'



const llm = new ChatCerebras({
    model: "llama-3.3-70b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.CEREBRAS_API_KEY
});


// const prompt1 = ChatPromptTemplate.fromMessages([
//     [
//         "system",
//         `Summarize this chat history provided here.

//         here's the chat history {chathistory}
// `,
//     ],
   
// ]);


const prompt1 = PromptTemplate.fromTemplate( `Summarize this chat history provided here.

        here's the chat history {chathistory}
`,
);




const chain = prompt1.pipe(llm);

const result = await chain.invoke({
   chathistory:"user : hello,  ai : how can help you today"
});

console.log(result);


// const prompt = ChatPromptTemplate.fromMessages([
//     [
//         "system",
//         `You are a senior customer support AI for a SaaS product.

// Your job:
// - Understand the user's issue using conversation context
// - Decide the best next action

// Rules:
// - Be concise
// - Do NOT explain internal reasoning
// - Use only the provided context
// `,
//     ],
//     [
//         "system",
//         `Conversation context:
// - User plan: {plan}
// - Previous issue: {previous_issue}
// - Account status: {account_status}
// `,
//     ],
//     ["user", "{input}"],
// ]);


// const supportDecisionSchema = z.object({
//     intent: z.enum([
//         "billing_issue",
//         "technical_issue",
//         "account_issue",
//         "general_question",
//     ]),
//     urgency: z.enum(["low", "medium", "high"]),
//     action: z.enum([
//         "answer_user",
//         "escalate_to_human",
//         "request_more_info",
//     ]),
//     reply: z.string().describe("Message shown to the user"),
// });

// const structuredLlm = llm.withStructuredOutput(supportDecisionSchema);

// const chain = prompt.pipe(structuredLlm);

// const result = await chain.invoke({
//     plan: "Free",
//     previous_issue: "Payment failed last month",
//     account_status: "Active",
//     input: "Why can't I export my data?",
// });

// console.log(result);


