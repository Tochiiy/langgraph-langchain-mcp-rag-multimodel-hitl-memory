// Trimming


import { trimMessages } from "@langchain/core/messages";
import { StateGraph, StateSchema, MessagesValue, START, MemorySaver } from "@langchain/langgraph";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import "dotenv/config";

const State = new StateSchema({
  messages: MessagesValue,
});

const llm = new ChatFireworks({
  model: "accounts/fireworks/models/minimax-m2p7",
  temperature: 0.7,
  apiKey: process.env.FIREWORKS_API_KEY
})

const callModel = async (state) => {
  const messages = await trimMessages(state.messages, {
    strategy:"first",
    maxTokens: 128,
    startOn: "human",
    endOn: ["human", "tool"],
    tokenCounter: llm,
  });

  console.log('========================================')

  console.log("Trimmed message : ",messages)
  console.log('========================================')
  console.log('========================================')

  const response = await llm.invoke(messages);
  return { messages: [response] };
};


const builder = new StateGraph(State)
  .addNode("call_model", callModel)
  .addEdge(START, "call_model");

const graph = builder.compile({ checkpointer:new MemorySaver()});

const config = { configurable: { thread_id: "1" } };

const result=await graph.invoke({ messages: [{ role: "user", content: "hi, my name is bob" }] }, config);
await graph.invoke({ messages: [{ role: "user", content: "write a short poem about cats" }] }, config);
await graph.invoke({ messages: [{ role: "user", content: "now do the same but for dogs" }] }, config);
const result2=await graph.invoke({ messages: [{ role: "user", content: "now do the same but for goats" }] }, config);



console.log('graph result  : ',result2)

