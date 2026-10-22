//delete  a message

import { RemoveMessage,HumanMessage } from "@langchain/core/messages";
import { StateGraph, StateSchema, MessagesValue, START, MemorySaver } from "@langchain/langgraph";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { AIMessage } from "@langchain/core/messages";

import "dotenv/config";
import { stat } from "node:fs";

const model = new ChatFireworks({
  model: "accounts/fireworks/models/minimax-m2p7",
  temperature: 0.7,
  apiKey: process.env.FIREWORKS_API_KEY
})

const State = new StateSchema({
  messages: MessagesValue,
});


const deleteMessages= (state) => {
  const messages = state.messages;
  if (messages.length > 2) {
    // remove the earliest two messages
    const exctractedMessages= messages.slice(0, 2).map(m => new RemoveMessage({ id: m.id })) 
     console.log('chat history : ',exctractedMessages)
    return { messages:exctractedMessages};
  }
  return {};
};

const callModel = async (state) => {
   
  const response = await model.invoke(state.messages);
  return { messages: [response] };
};

const builder = new StateGraph(State)
  .addNode("call_model", callModel)
  .addNode("delete_messages", deleteMessages)
  .addEdge(START, "call_model")
  .addEdge("call_model", "delete_messages");

const checkpointer = new MemorySaver();
const graph = builder.compile({ checkpointer });

const config = { configurable: { thread_id: "1" } };



 const testMessages = [
    // new HumanMessage({ id: "m1", content: "Hi, I am planning a trip to Tokyo." }),
    // new AIMessage({ id: "m2", content: "That sounds exciting! Tokyo is beautiful. When are you going?" }),
    // new HumanMessage({ id: "m3", content: "I am going this October for two weeks." }),
    // new AIMessage({ id: "m4", content: "October has fantastic weather for sightseeing. What is your budget?" }),
    new HumanMessage({ id: "m5", content: "Around $3000 excluding flights." }),
    new AIMessage({ id: "m6", content: "Perfect, that allows for great hotels and sushi. Any specific spots you want to visit?" }),
    new HumanMessage({ id: "m7", content: "I want to see Shibuya Crossing and Akihabara." })
  ];

  const result=await graph.invoke({ messages: testMessages }, config);
  console.log(result)