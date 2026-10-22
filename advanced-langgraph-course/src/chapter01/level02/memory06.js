
import {
  SystemMessage,
  HumanMessage,
  RemoveMessage,
} from "@langchain/core/messages";
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  
  START,
  END,
  MemorySaver,
} from "@langchain/langgraph";
import * as z from "zod";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { AIMessage } from "@langchain/core/messages";

import "dotenv/config";

const memory = new MemorySaver();

const GraphState = new StateSchema({
  messages: MessagesValue,
  summary: z.string().default(""),
});



const model = new ChatFireworks({
  model: "accounts/fireworks/models/minimax-m2p7",
  temperature: 0.7,
  apiKey: process.env.FIREWORKS_API_KEY
})


const callModel = async (state) => {
  const { summary } = state;
  let { messages } = state;
  if (summary) {
    const systemMessage = new SystemMessage({
      id: crypto.randomUUID(),
      content: `Summary of conversation earlier: ${summary}`,
    });
    messages = [systemMessage, ...messages];
  }
  const response = await model.invoke(messages);
  return { messages: [response] };
};

const shouldContinue = (state) => {
  const messages = state.messages;
  if (messages.length > 6) {
    return "summarize_conversation";
  }
  return END;
};

const summarizeConversation= async (state) => {

  const { summary, messages } = state;
  let summaryMessage;
  if (summary) {
    
    summaryMessage =
      `This is summary of the conversation to date: ${summary}\n\n` +
      "Extend the summary by taking into account the new messages above:";
  } else {
    summaryMessage = "Create a summary of the conversation above:";
  }

  const allMessages = [
    ...messages,
    new HumanMessage({ id: crypto.randomUUID(), content: summaryMessage }),
  ];

  const response = await model.invoke(allMessages);


  const deleteMessages = messages
    .slice(0, -2)
    .map((m) => new RemoveMessage({ id: m.id }));

  if (typeof response.content !== "string") {
    throw new Error("Expected a string response from the model");
  }

  return { summary: response.content, messages: deleteMessages };
};

// Define a new graph
const workflow = new StateGraph(GraphState)
  .addNode("conversation", callModel)
  .addNode("summarize_conversation", summarizeConversation)
  // Set the entrypoint as conversation
  .addEdge(START, "conversation")
  .addConditionalEdges( "conversation", shouldContinue,
  )
  .addEdge("summarize_conversation", END);

const app = workflow.compile({ checkpointer: memory });




async function runTest() {
  console.log("🚀 Starting graph invocation test...");

  // Generate 7 mock sequential messages to intentionally cross the >6 threshold
  const testMessages = [
    new HumanMessage({ id: "m1", content: "Hi, I am planning a trip to Tokyo." }),
    new AIMessage({ id: "m2", content: "That sounds exciting! Tokyo is beautiful. When are you going?" }),
    new HumanMessage({ id: "m3", content: "I am going this October for two weeks." }),
    new AIMessage({ id: "m4", content: "October has fantastic weather for sightseeing. What is your budget?" }),
    new HumanMessage({ id: "m5", content: "Around $3000 excluding flights." }),
    new AIMessage({ id: "m6", content: "Perfect, that allows for great hotels and sushi. Any specific spots you want to visit?" }),
    new HumanMessage({ id: "m7", content: "I want to see Shibuya Crossing and Akihabara." })
  ];

  const config = { 
    configurable: { 
      thread_id: "test-trip-planning-session" 
    } 
  };

  try {
    const outputState = await app.invoke(
      { messages: testMessages }, 
      config
    );

    console.log("\n--- Generated Long-Term Summary ---");
    console.log(outputState);

  } catch (error) {
    console.error("❌ Execution Failed:", error);
  }
}

// Execute the test run
runTest();
