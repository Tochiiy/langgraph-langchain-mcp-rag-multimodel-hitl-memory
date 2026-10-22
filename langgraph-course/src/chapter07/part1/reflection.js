import {
    END,
    START,
    StateGraph,
    Annotation,
    MessagesAnnotation,
} from "@langchain/langgraph";
import { createAgent } from "langchain";
import { z } from "zod";
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages";

import {
    GENERATION_ESSAY_POMPT, REFLECTION_POMPT,REVISION_PROMPT

} from "./prompts.js";

import { ChatCerebras } from "@langchain/cerebras";
import "dotenv/config";


const model = new ChatCerebras({
    model: "gpt-oss-120b",
    temperature: 0.7,
    apiKey: process.env.CEREBRAS_API_KEY,
});

const StateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    generatedEssay: Annotation({
        default: () => null
    }),
    corrections: Annotation({
        default: () => null,
    }),
    finalEssay: Annotation({
        default: () => null
    }),
});

// Create the graph
// mainnode
const generateNode = async (state) => {
    const messageHistory = state.messages;

    const result = await model.invoke([
        {
            role: "system",
            content: GENERATION_ESSAY_POMPT,
        },
        ...messageHistory
    ]);
    const content = result?.content


    return { nextNode: "reflectionNode", generatedEssay: content };
};


const reflectionNode = async (state) => {
    const agent = createAgent({
        model,
        systemPrompt: REFLECTION_POMPT
    })

    
const agentOutput = await agent.invoke({
    messages: [new HumanMessage(
        `
                Generated Essay:
                <generated_essay>
                ${state.generatedEssay}
                </generated_essay>
      `
    )],
});



const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content

    return { corrections: aiResponse }
};


const generateFinalEssayNode = async (state) => {
    const agent = createAgent({
        model,
        systemPrompt: REVISION_PROMPT
    })

    
const agentOutput = await agent.invoke({
    messages: [new HumanMessage(
        `
        Generated Essay:
        <generated_essay>
        ${state.generatedEssay}
        </generated_essay>

        Critics or corrections :
        <correction_to_apply>
        ${state.corrections}
        </correction_to_apply>

      `
    )],
});



const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content

    return { finalEssay: aiResponse }
};



const builder = new StateGraph(StateAnnotation)

    .addNode("generateNode", generateNode)
    .addNode("reflectionNode", reflectionNode)
    .addNode("generateFinalEssayNode", generateFinalEssayNode)


    .addEdge(START, "generateNode")
    .addEdge("generateNode", "reflectionNode")
    .addEdge("reflectionNode", 'generateFinalEssayNode')
    .addEdge('generateFinalEssayNode',END)

const graph = builder.compile();
// Invoke the graph

const result = await graph.invoke({
    messages: [
        new HumanMessage({ content: "Write an essay on how artificial intelligence is shaping the future of work and society" }),
    ],
});
console.log("graph result ========",result);



// // Stream the results
// const stream = await app.stream(input, {
//   stream_mode: ["messages", "updates"] // You can select multiple modes
// });

// for await (const chunk of stream) {
//   // Process the streamed chunks
//   // The structure of the chunk depends on the stream_mode
//   console.log(chunk); 
// }