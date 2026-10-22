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
  QUERY_REWRITE_PROMPT, SYNTENSIS_RESPONSE_PROMPT, SYSTEM_PROMPT, CATEGORIZATION_SYSTEM_PROMPT

} from "./prompts.js";
import { retriever } from "./retrieving-pipeline.js";

import { ChatCerebras } from "@langchain/cerebras";
import "dotenv/config";


const model = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0.7,
  apiKey: process.env.CEREBRAS_API_KEY,
});

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  rewriteQueries: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  nextNode: Annotation({
    default: () => null,
  }),
   retrievedDocuments: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
});

// Create the graph
// mainnode
const initialNode = async (state) => {
  const messageHistory = state.messages;


  const structuredLlm = model.withStructuredOutput(z.object({
    nextNode: z.enum(['QUERY_REWRITE', 'OUT_OF_SCOPE'])
  }).describe('nextnode to route to'));

  const result = await structuredLlm.invoke([
    {
      role: "system",
      content: CATEGORIZATION_SYSTEM_PROMPT,
    },
    ...messageHistory
  ]);

  return { nextNode: result?.nextNode };
};


const queryRewriterNode = async (state) => {
  const last = state.messages
    .filter((m) => m._getType() === "human")
    .slice(-1)[0];


  const structuredLlm = model.withStructuredOutput(z.object({
    questions: z.array(z.string()).length(3)
  }).describe('rewrite queries'));

  const result = await structuredLlm.invoke([
    {
      role: "ai",
      content: QUERY_REWRITE_PROMPT,
    },
    {
      role: "user",
      content: last?.content,
    },
  ]);

  const questions = result?.questions

  return { nextNode: 'retrieverNode', rewriteQueries: [...questions] };
};

const retrieverNode = async (state) => {

  const retrievedDocs=[]
  for(const query of state.rewriteQueries ){
      const docs=await retriever(query)
      retrievedDocs.push(docs)
  }
  const flatten=retrievedDocs.flat()
  return {  retrievedDocuments: [...flatten] };
};


const generateNode = async (state) => {
  // console.log('generate response.......',state.retrievedDocuments)

  const agent = createAgent({
    model,
    systemPrompt:SYNTENSIS_RESPONSE_PROMPT
})

const retrievedDocToString=formatDocumentsAsString(state.retrievedDocuments)

const agentOutput = await agent.invoke({
    messages: [new HumanMessage(`
      
User Question:
<user_questions>
${state.rewriteQueries.join("\n")}
</user_questions>


Retrieved Data:
<retrieved_data>
${retrievedDocToString}
</retrieved_data>

      `)],
});
const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content

console.log('FINAL RESPONSE=================',aiResponse)
};

const formatDocumentsAsString = (documents) => {
  return documents.map((doc) => doc?.pageContent).join("\n\n");
};


const outOfScopeNode = async (state) => {
  const aiResponse = new AIMessage({
    content:
      "Sorry, I cant assist you with that",
  });

  return { messages: [aiResponse] };
};





const builder = new StateGraph(StateAnnotation)
  .addNode("initialNode", initialNode)
  .addNode("queryRewriterNode", queryRewriterNode)
  .addNode("retrieverNode", retrieverNode)
  .addNode("generateNode", generateNode)
  .addNode("outOfScopeNode", outOfScopeNode)

  .addEdge(START, "initialNode")

  .addConditionalEdges("initialNode", (state) => {
    console.log("state.nextNode :-:: ", state.nextNode);

    if (state.nextNode === "QUERY_REWRITE") return "queryRewriterNode";

    if (state.nextNode === "OUT_OF_SCOPE") return "outOfScopeNode";
    return END;
  })
  .addConditionalEdges("queryRewriterNode", (state) => {
    if (state.nextNode === "retrieverNode") {
      return "retrieverNode";
    } else {
      return END;
    }
  })
  .addEdge("retrieverNode", "generateNode")
  
.addEdge("generateNode", END)
.addEdge("outOfScopeNode", END);

const graph = builder.compile();
// Invoke the graph

const result = await graph.invoke({
  messages: [
    new HumanMessage({ content: "what is prompt engineering" }),
  ],
});
// console.log(result);
