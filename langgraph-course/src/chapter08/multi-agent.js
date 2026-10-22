import {
    END,
    START,
    StateGraph,
    Annotation,
    MessagesAnnotation,
    Command
} from "@langchain/langgraph";
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages";
import {  createAgent } from "langchain";
import { ChatCerebras } from "@langchain/cerebras";
import {searchTool} from './tools.js'
import { z } from "zod";

import {managerPrompt,researcherPrompt,summarizerPrompt} from './prompts.js'
import "dotenv/config";

// free 
const model = new ChatCerebras({
    model: "gpt-oss-120b",
    temperature: 0.7,
    apiKey: process.env.CEREBRAS_API_KEY,
});
// 1. IMPROVED AGENT NODE: Must accept and pass 'config'
async function createAgentNode({ systemPrompt, message, agentTools = [], config }) {
  const agent = createAgent({
     model, // In LangGraph prebuilt, this is 'llm'
    tools: agentTools,
     systemPrompt,
  });

  // We pass the parent config so LangChain can track the nested run ID
  const result = await agent.invoke(
    { messages: [new HumanMessage(message)] },
    config 
  );

  return result.messages[result.messages.length - 1];
}

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  nextNode: Annotation(),
});

const ManagerAgent = async (state, config) => {
  console.log('--- Entering Node A ---');
  
    const last = state.messages
        .filter((m) => m._getType() === "human")
        .slice(-1)[0];

    const aiMessage = await createAgentNode({
        systemPrompt: managerPrompt,
        message: last?.content,
    });


    console.log('=================end node Manager====================================')


        const shouldHandoff = aiMessage?.content?.includes("__REQUEST__")
    
        if (shouldHandoff) {
            return new Command({
                update: { messages: [new AIMessage(aiMessage?.content)] },
                goto: "ResearcherAgent",
            });
        }
    
        return new Command({
            update: { messages: [new AIMessage(aiMessage?.content)]},
            goto: END
        });

};



const ResearcherAgent = async (state, config) => {
  console.log('--- Entering Node ResearcherAgent ---');
  
    const last = state.messages
        .filter((m) => m._getType() === "ai")
        .slice(-1)[0];

    const aiMessage = await createAgentNode({
        systemPrompt: researcherPrompt,
        message: last?.content,
        agentTools:[searchTool]
    });


    console.log('=================end node ResearcherAgent====================================')


    return new Command({
        update: { messages: [new AIMessage(aiMessage?.content)] },
        goto: "SummarizerAgent",
    });
};
// 3. NODE B: Injecting the Task Tool with Tracking
const SummarizerAgent = async (state, config) => {
  console.log('--- Entering Node SummarizerAgent ---');

     const last = state.messages
        .filter((m) => m._getType() === "ai")
        .slice(-1)[0];
  
   const aiMessage = await createAgentNode({
         systemPrompt: summarizerPrompt,
         message: last?.content,
     });
 

  return new Command({
    update: { messages: [aiMessage] },
    goto: END,
  });
};


// 3. Build the Graph
const workflow = new StateGraph(StateAnnotation)
    .addNode("ManagerAgent", ManagerAgent)
    .addNode("ResearcherAgent", ResearcherAgent)
    .addNode("SummarizerAgent", SummarizerAgent)

    .addEdge("__start__", "ManagerAgent")
    .addConditionalEdges('ManagerAgent', (state) => {
        if (state.nextNode === "ResearcherAgent") {
            return "ResearcherAgent"
        }
        return END

    })
    .addEdge('ResearcherAgent','SummarizerAgent')
    .addEdge("SummarizerAgent", '__end__')

const graph = workflow.compile();



const result = await graph.invoke(
  { messages: [new HumanMessage("what is the current weather in new york ?")] },
  
);



console.log("graph state==================", result);
