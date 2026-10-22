

// 1. approve
// Use approve to approve the tool call as-is and execute it without changes.

import { createAgent, HumanMessage } from "langchain";
import { humanInTheLoopMiddleware } from "langchain";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { MemorySaver } from "@langchain/langgraph";
import { filesystemTools, write_file } from '../tools/fsTools.js'
import { Command } from "@langchain/langgraph";


import "dotenv/config";


const llm = new ChatFireworks({
    model: "accounts/fireworks/models/minimax-m2p5",
    temperature: 0.7,
    apiKey: process.env.FIRE_WORKS_API_KEY
});


const agent = createAgent({
    model: llm,
    tools: [...filesystemTools],
    systemPrompt: "your helpfull assistant, you have access to a standard number of tools",
    middleware: [
        humanInTheLoopMiddleware({
            interruptOn: {
                 
                write_file: {
                    allowedDecisions: ["approve", "reject"],
                    description: "🚨 File creation requires human approval",
                },
                
                delete_file: {
                    allowedDecisions: ["approve", "reject"],
                    description: "🚨 File deletion requires human approval",
                },
            },
            descriptionPrefix: "Tool execution pending approval",
        }),
    ],
   
    checkpointer: new MemorySaver(),
});



const config = { configurable: { thread_id: "some_idx" } };





// Stream agent progress and LLM tokens until interrupt
for await (const [mode, chunk] of await agent.stream(
    { messages: [{ role: "user", content: "create a file ben.txt pass in : ben is a programmer" }] },
    { ...config, streamMode: ["updates", "messages"] }
)) {
    if (mode === "messages") {
        // LLM token
        const [token, metadata] = chunk;
        if (token.content) {
            process.stdout.write(token.content);
        }
    } else if (mode === "updates") {
        // Check for interrupt
        if ("__interrupt__" in chunk) {
             const humanConsent = "approve"

                if (humanConsent==="approve") {

                    console.log('=================================APPROVAL=========================')
                    const agentoutput = await agent.invoke(
                        new Command({
                            resume: { decisions: [{ type: "approve" }] }, // or "reject"
                        }),
                        config // Same thread ID to resume the paused conversation
                    );

                    console.log("agentoutput==================", agentoutput)
                }else{
                        console.log('=================================REJECT=========================')
                            
                    const agentoutput = await agent.invoke(
                            new Command({
                                resume: { decisions: [{ type: "reject" }] }, // or "reject"
                            }),
                            config // Same thread ID to resume the paused conversation
                        );

                        console.log("agentoutput==================", agentoutput)
                }

        }
    }
}


