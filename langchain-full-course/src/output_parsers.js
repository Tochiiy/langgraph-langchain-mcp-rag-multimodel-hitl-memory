import "dotenv/config";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import z from "zod";

import { ChatCerebras } from "@langchain/cerebras";



// // free 1M
const llm = new ChatCerebras({
    model: "llama-3.3-70b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.CEREBRAS_API_KEY
});



const animalSchema = z.object({
  animals:z.array(z.string()).describe('List of wild animals')
}).describe('return a list of wild animals');


const booleanSchema = z.object({
  val:z.boolean().describe(' true or false')
}).describe('return true or false ');


const structuredLlm = llm.withStructuredOutput(booleanSchema);
const result = await structuredLlm.invoke([

        new HumanMessage('Does a lion eat meat ?')
   
]);


console.log('result :: ',result)
