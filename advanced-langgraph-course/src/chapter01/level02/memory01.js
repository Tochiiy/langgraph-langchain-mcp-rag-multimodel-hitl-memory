
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
  console.log(state.messages)
};

const builder = new StateGraph(StateAnnotation)
  .addNode("call_model", callModel)
  .addEdge(START, "call_model");

const graph = builder.compile();

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

console.log(result2)