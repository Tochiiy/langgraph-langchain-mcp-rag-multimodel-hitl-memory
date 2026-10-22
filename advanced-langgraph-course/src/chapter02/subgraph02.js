import { StateGraph, StateSchema, START } from "@langchain/langgraph";
import * as z from "zod";

// Very Important in agent collaboration==============//


const SubgraphState = new StateSchema({
  // note that none of these keys are shared with the parent graph state
  bar: z.string(),
  baz: z.string(),
});

const subgraphBuilder = new StateGraph(SubgraphState)
  .addNode("subgraphNode1", (state) => {
    return { baz: "baz" };
  })
  .addNode("subgraphNode2", (state) => {
    return { bar: state.bar + state.baz };
  })
  .addEdge(START, "subgraphNode1")
  .addEdge("subgraphNode1", "subgraphNode2");

const subgraph = subgraphBuilder.compile();

// Define parent graph
const ParentState = new StateSchema({
  foo: z.string(),
});

const builder = new StateGraph(ParentState)
  .addNode("node1", (state) => {
    return { foo: "hi! " + state.foo };
  })
  .addNode("node2", async (state) => {
    const response = await subgraph.invoke({ bar: state.foo });
    return { foo: response.bar };
  })
  .addEdge(START, "node1")
  .addEdge("node1", "node2");

const graph = builder.compile();

const stream = await graph.stream(
  { foo: "foo" },
  // Stream subgraph outputs
  { subgraphs: true }
);
for await (const chunk of stream) {
    console.log(chunk)
  
}