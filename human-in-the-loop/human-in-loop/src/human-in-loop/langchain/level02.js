
import { createAgent, HumanMessage } from "langchain";
import { humanInTheLoopMiddleware } from "langchain";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { MemorySaver } from "@langchain/langgraph";
import { filesystemTools } from '../tools/fsTools.js'
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
                write_file: true, // All decisions (approve, edit, reject) allowed
                delete_file: {
                    allowedDecisions: ["approve", "reject"],
                    description: "🚨 file deletion requires human approval",
                },
                // Safe operation, no approval needed
                read_file: false,
            },
         
            descriptionPrefix: "Tool execution pending approval",
        }),
    ],
    checkpointer: new MemorySaver(),
});



const config = { configurable: { thread_id: "some_idx" } };

// Run the graph until the interrupt is hit.
const result = await agent.invoke(
    {
        messages: [new HumanMessage("create a file ben.md and pass in hello world")],
    },
    config
);

const humanInLoop = result.__interrupt__

// console.log('human in loop  ==',humanInLoop)

if (humanInLoop) {
console.log('===================human in the loop============')
  
    const humanInput = "edit"
    if (humanInput==="edit") {

        console.log('=================================Edit=========================')
        const agentoutput = await agent.invoke(
            new Command({
                resume: {
                    decisions: [
                        {
                            type: "edit",
                            editedAction: {
                                name: 'write_file',
                                args: {
                                    filename:"ben.md",
                                    content: "Ben, is a programmer"
                                },
                            }
                        }
                    ]
                }
            }),
            config  
        );

        console.log("agentoutput========in edit==========", agentoutput)
    } 
    else if(humanInput==="approve"){
          const agentoutput = await agent.invoke(
                    new Command({
                        resume: { decisions: [{ type: "approve" }] }, // or "reject"
                    }),
                    config // Same thread ID to resume the paused conversation
                );
                console.log("agentoutput===in approve===============", agentoutput)
        
    }
    
    else {

        console.log('=====================NO APPROVAL==========================')
        console.log('=====================NO APPROVAL==========================')

    }

  


}

// console.log('result =====',result)