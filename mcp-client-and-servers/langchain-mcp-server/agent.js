

import { createAgent, HumanMessage } from "langchain";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import "dotenv/config";

import { MultiServerMCPClient } from "@langchain/mcp-adapters";
const client = new MultiServerMCPClient({
    mcpServers: {

        "ben-mcp-server": {
            transport: "http",
            url: "http://localhost:3001/mcp",
             headers: {
                "x-api-key":"zJW-eIwsAxewEZqGRIC4sxehq5OwMjLgYHyXJ2UMv7E" 
            }
        },
        "ben-mcp-stdio": {
            transport: "stdio",  
            command: "node",
            args: ["./src/level02/mcp-stdio-server.js"],
        },


    }
})

const tools = await client.getTools();

const resourceResponse = await client.readResource("ben-mcp-stdio", "db://main/schema");
const userResource = await client.readResource("ben-mcp-stdio", "user://profile");





const schemaContext = resourceResponse[0].text;
const userContext=userResource[0]?.text


// 1. Get the specific server instance from the client
const serverInstance = await client.getClient("ben-mcp-stdio"); 
// 2. Use the raw request method to call 'prompts/get'
const promptResponse = await serverInstance.request(
    {
        method: "prompts/get",
        params: {
            name: "sql-report-helper",
            arguments: { topic: "user spending" }
        }
    },
    // This is the expected schema for the response
    z.object({
        messages: z.array(z.any())
    })
);

console.log("Prompt found:", promptResponse.messages);



const llm = new ChatFireworks({
    model: "accounts/fireworks/models/deepseek-v3p1",
    temperature: 0.7,
    apiKey: process.env.FIREWORKS_API_KEY
});




const agent = createAgent({
    model: llm,
    tools: [...tools],
    systemPrompt: ` You are a highly intelligent AI assistant with access to standard number of tools`

});




const agentOutput = await agent.invoke({
    messages: [
        new HumanMessage(`
            Here is the database schema for your reference:
            ${schemaContext}

            Now, write a SQL query to find the total 'amount' spent by each user email.
            
            CRITICAL: Do NOT call any tools.
        `)
    ],
});
// const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content

console.log(agentOutput)
