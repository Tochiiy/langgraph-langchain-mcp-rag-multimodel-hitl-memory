import { END, START, StateGraph, Annotation } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  aggregate: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),

  users: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => ["intial item"]
  }),

});


const nodeA = (state) => {
  console.log('From node A ===')
  return { users: [`Chris`] };
};

const nodeB = (state) => {
  console.log('From node B ===')
  return { users: [`Been`] };
};



const builder = new StateGraph(StateAnnotation)
  .addNode("a", nodeA)
  .addNode("b", nodeB)


  .addEdge(START, "a")
  .addEdge("a", "b")
  .addEdge("b", END)



const graph = builder.compile();
// Invoke the graph
const baseResult = await graph.invoke({ aggregate: [], users: ["albert"] });
console.log("Base Result: ", baseResult);

// Note :
// Explain what is a state
// How state change
// start node end Node
// 