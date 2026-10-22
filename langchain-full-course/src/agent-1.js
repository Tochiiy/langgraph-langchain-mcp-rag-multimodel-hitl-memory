import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
    // BaseMessage,
    SystemMessage,
    HumanMessage,
} from "@langchain/core/messages";
import { createAgent } from "langchain";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";

import "dotenv/config";

// const model = new ChatCerebras({
//     model: "llama-3.3-70b",
//     temperature: 0,
//     maxTokens: undefined,
//     maxRetries: 2,
//     apiKey: process.env.CEREBRAS_API_KEY
// });


const model= new ChatFireworks({
        model: "accounts/fireworks/models/deepseek-v3p1",
        temperature: 0.7,
        apiKey: process.env.FIRE_WORKS_API_KEY,
      });




const client = new Exa(process.env.EXA_SEARCH_API_KEY);
const searchTool = tool(
    async ({ query }) => {

        const exaTool = new ExaSearchResults({
            client,
            searchArgs: {
                numResults: 2,
                type: "auto",
            },
        })


        const result = await exaTool.invoke(query);
        return result

    },
    {
        name: "search_web",
        description: "Search the web  to find real-time information.",
        schema: z.object({
            query: z.string(),
        }),
    }
);



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
        description: "Fetch a list of user in the database",
        schema: z.object({
            userName: z.string(),
            userAge: z.number()
        }),
    }
);


const agent = createAgent({
    model,
    tools: [searchTool, fetchListOfUsers],
    systemPrompt: `Your are a helpfull AI assistant that chat with User in English

    you have  Access to tools

    1. fetchListOfUsers it takes (userName and age as parameter)
    `
});



const agentOutput = await agent.invoke({
    messages: [new HumanMessage('fetch a list of user in the database, here is the name =Ben and age=24')],
}, {
    recursionLimit: 30,
});
// const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content

console.log(agentOutput)

