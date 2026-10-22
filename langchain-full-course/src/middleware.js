import { tool } from "@langchain/core/tools";
// import { z } from "zod";
import * as z from "zod";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ChatCerebras } from "@langchain/cerebras";
import {
  // BaseMessage,
  SystemMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { createAgent } from "langchain";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";
import { createMiddleware, AIMessage, initChatModel } from "langchain";

import "dotenv/config";

const model = new ChatCerebras({
  model: "qwen-3-32b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,

});




// node-style hooks
const chatHistoryMiddleware = createMiddleware({
  name: "chatHistoryMiddleware",
  beforeModel: (state) => {

    console.log('store   user message in chat history ', state.messages)

  },
  afterModel: (state) => {
    const lastMessage = state.messages[state.messages.length - 1];
    console.log(`store ai message in chat history: ${lastMessage.content}`);
    return;
  },
});










const toolMonitoringMiddleware = createMiddleware({
  name: "ToolMonitoringMiddleware",
  wrapToolCall: (request, handler) => {
    console.log(`Executing tool: ${request.toolCall.name}`);
    console.log(`Arguments: ${JSON.stringify(request.toolCall.args)}`);

    try {
      const result = handler(request);
      console.log("Tool completed successfully");
      return result;
    } catch (e) {
      console.log(`Tool failed: ${e}`);
      throw e;
    }
  },

});





const fetchListOfUsers = tool(
  async ({ userName, userAge }) => {
    // sql query here 
    if (userName === 'Ben' && userAge === 24) {
      return [
        "ben", "alice", "john"
      ]
    }
    return [
      'No user found in the database'
    ]
  },
  {
    name: "fetch user in database",
    description: "Fetch a list of user in the database userName=Ben and age=24",
    schema: z.object({
      userName: z.string(),
      userAge: z.number()
    }),
  }
);



const qweenModel = await initChatModel("cerebras:qwen-3-32b");
const llamaModel = await initChatModel("cerebras:llama-3.3-70b");

const dynamicModelMiddleware = createMiddleware({
  name: "DynamicModelMiddleware",
  wrapModelCall: async (request, handler) => {

    try {

      const modifiedRequest = { ...request };
      if (request.messages.length > 2) {
        console.log('qween...')
        modifiedRequest.model = qweenModel
      } else {
        console.log('llama...')
        modifiedRequest.model = llamaModel
      }
      // Call the model
      return await handler(modifiedRequest);
    } catch (error) {
      // Handle errors and retry with fallback
      const fallbackRequest = { ...request, model: qweenModel };
      return await handler(fallbackRequest);
    }

  },
});


const createRetryMiddleware = (maxRetries = 3) => {
  return createMiddleware({
    name: "RetryMiddleware",
    // 1. MUST be async
    wrapModelCall: async (request, handler) => { 
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt + 1} starting...`); // Add this to confirm loop starts
          
          // 2. MUST use await
          return await handler(request); 

        } catch (e) {
          console.log(`Caught error: ${e.message}`); // Debug log
          if (attempt === maxRetries - 1) {
            throw e;
          }
          console.log(`Retry ${attempt + 1}/${maxRetries} after error: ${e.message}`);
        }
      }
      throw new Error("Unreachable");
    },
  });
};

// main agent
const agent = createAgent({
  model: model,
  systemPrompt: `Your are a helpfull AI assistant that chat with User in English

    you have  Access to tools

    1. fetchListOfUsers it takes (userName and age as parameter)
    `,
  tools: [fetchListOfUsers],
  middleware: [createRetryMiddleware(3),toolMonitoringMiddleware,dynamicModelMiddleware],
});

const agentOutput = await agent.invoke({
  messages: [
    new HumanMessage('what is the current weather is new york'),
    new HumanMessage('fetch me a list of users '),
    new HumanMessage('What is the capital of Russia')

  ],

});
const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content

console.log(aiResponse)




