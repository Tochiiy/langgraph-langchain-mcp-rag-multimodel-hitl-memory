
// Graph with a checkpointer
import { StateGraph, StateSchema, ReducedValue, Annotation, START, END, MemorySaver } from "@langchain/langgraph";
import { z } from "zod";

// const State = new StateSchema({
//   foo: z.string(),
//   bar: new ReducedValue(
//     z.array(z.string()).default(() => []),
//     {
//       inputSchema: z.array(z.string()),
//       reducer: (x, y) => x.concat(y),
//     }
//   ),
// });

const MyGraphState = Annotation.Root({
   foo: Annotation({
    default: () => "",
   }),
    bar: Annotation({
    // Merges current items with the new array items returned by a node
    reducer: (current, update) => current.concat(update),
    // Ensures the array starts empty rather than undefined
    default: () => [],
  }),
});


const nodeA=(state) => {
    return { foo: "a", bar: ["a"] };
  }

const nodeB= (state) => {
    return { foo: "b", bar: ["b"] };
  }

const workflow = new StateGraph(MyGraphState)
  .addNode("nodeA", nodeA)
  .addNode("nodeB",nodeB)
  
  .addEdge(START, "nodeA")
  .addEdge("nodeA", "nodeB")
  .addEdge("nodeB", END);

const checkpointer = new MemorySaver();
const graph = workflow.compile({ checkpointer });

const config = { configurable: { thread_id: "1" } };

const graphResult=await graph.invoke({ foo: "", bar: [] }, config);


console.log("======graph====",graphResult)