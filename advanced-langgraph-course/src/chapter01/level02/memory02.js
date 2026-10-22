
// ==========================
// Add long-term memory
// ==========================

// Use long-term memory to store user-specific or application-specific data across conversations.
import { InMemoryStore, StateGraph } from "@langchain/langgraph";
import { StateSchema, MessagesValue, START } from "@langchain/langgraph";
import "dotenv/config";

const store = new InMemoryStore();

const State = new StateSchema({
  messages: MessagesValue,
});

const callModel = async (state, runtime) => {
  const userId = runtime.context?.userId;
  const namespace = [userId, "memories"];


  await runtime.store.put(namespace, "doc1", { topic: "Python" });
  await runtime.store.put(namespace, "doc2", { topic: "TypeScript" });

  const results = await store.search(namespace, {
   filter:{
    topic:"TypeScript"
   },

  });
  console.log("Found memories:", results);

};




const builder = new StateGraph(State)
  .addNode("call_model", callModel)
  .addEdge(START, "call_model");

const graph = builder.compile({ store });

// Pass context at invocation time
const graphResult = await graph.invoke(
  { messages: [{ role: "user", content: "dark" }] },
  { configurable: { thread_id: "1" }, context: { userId: "1" } }
);


console.log("===result===", graphResult)