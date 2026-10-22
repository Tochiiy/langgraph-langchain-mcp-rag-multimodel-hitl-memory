

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
                    // No editing allowed
                    description: "🚨 File creation requires human approval",
                },
                
                delete_file: {
                    allowedDecisions: ["approve", "reject"],
                    // No editing allowed
                    description: "🚨 File deletion requires human approval",
                },
                

            },
            // interrupt messages - combined with tool name and args to form the full message
            // e.g., "Tool execution pending approval: delete_file 
            descriptionPrefix: "Tool execution pending approval",
        }),
    ],
    // Human-in-the-loop requires checkpointing to handle interrupts.
    // In production, use a persistent checkpointer like AsyncPostgresSaver.
    checkpointer: new MemorySaver(),
});



const config = { configurable: { thread_id: "some_idx" } };

// Run the graph until the interrupt is hit.
const result = await agent.invoke(
    {
        messages: [new HumanMessage("create a file name todo.md and is the first task eg: create the nodejs app")],
    },
    config
);

const humanInLoop = result.__interrupt__

// console.log('human in loop   === ',humanInLoop)

if (humanInLoop) {
    console.log('========human in loop=================')

    const hitlAction = result.__interrupt__[0]?.value?.actionRequests[0]
    const hitlConfig = result.__interrupt__[0]?.value?.reviewConfigs[0]?.allowedDecisions

    const humanConsent = "reject"

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


// console.log("agent result    ==  ",result)