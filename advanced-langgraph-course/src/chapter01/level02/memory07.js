

// Manage checkpoints

import { StateGraph, StateSchema, MessagesValue, START,Annotation,MessagesAnnotation } from "@langchain/langgraph";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { MemorySaver } from "@langchain/langgraph";
import "dotenv/config";

// Add short-term memory
const checkpointer = new MemorySaver();


const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec
});


const llm = new ChatFireworks({
      model: "accounts/fireworks/models/minimax-m2p7",
  temperature: 0.7,
  apiKey:process.env.FIREWORKS_API_KEY
});


const callModel= async (state) => {
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
};


const otherAgent= async (state) => {
  try {
    // throw new Error('failed to run')
  } catch (error) {
    console.log(error?.message)
  }
};

const builder = new StateGraph(StateAnnotation)
  .addNode("call_model", callModel)
  .addNode("otherAgent", otherAgent)

  
  .addEdge(START, "call_model")
  .addEdge('call_model', "otherAgent")
  .addEdge('otherAgent','__end__')


const graph = builder.compile({checkpointer});

const config = {
  configurable: {
    thread_id: "1"
  }
};

const result1 = await graph.invoke(
  { messages: [{ role: "user", content: "hi! I'm bob" }] },
  { ...config }
);

const result2 = await graph.invoke(
  { messages: [{ role: "user", content: "What is my name" }] },
  { ...config }
);


const graphStateVal=await graph.getState(config);
// console.log('graph state val==  : ',graphStateVal)


const history = [];
for await (const state of graph.getStateHistory(config)) {
  history.push(state);
}

// console.log("==history array==  : ",JSON.stringify(history,null,2))
console.log("==history array==  : ",history)


// const threadId = "1";
// await checkpointer.deleteThread(threadId);



// // console.log('======================================================')
// // console.log('======================================================')

// const graphFinalValue=await graph.getState(config)

// console.log('graph final val   : ',graphFinalValue)