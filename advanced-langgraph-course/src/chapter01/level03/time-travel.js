import { v7 as uuid7 } from "uuid";
import { StateGraph, MemorySaver, START } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  topic: Annotation({
    default: () => "",
  }),
  joke: Annotation({
    default: () => "",
  })
});

function generateTopic(state) {
  return { topic: "socks in the dryer" };
}

function writeJoke(state) {
  return { joke: `Why do ${state.topic} disappear? They elope!` };
}

const checkpointer = new MemorySaver();
const graph = new StateGraph(StateAnnotation)
  .addNode("generateTopic", generateTopic)
  .addNode("writeJoke", writeJoke)

  .addEdge(START, "generateTopic")
  .addEdge("generateTopic", "writeJoke")
  .compile({ checkpointer });

// Step 1: Run the graph
const config = { configurable: { thread_id: uuid7() } };
const result = await graph.invoke({}, config);

// Step 2: Find a checkpoint to replay from
const states = [];
for await (const state of graph.getStateHistory(config)) {
  states.push(state);
}

// Step 3: Replay from a specific checkpoint
// next property we have the node name
const beforeJoke = states.find((s) => s.next.includes("writeJoke"));

const replayResult = await graph.invoke(null, beforeJoke.config);
// writeJoke re-executes (runs again), generateTopic does not