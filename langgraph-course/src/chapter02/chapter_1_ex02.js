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


const nodeC = (state) => {
  console.log('From node C ===')
  return { users: [`Data from node C`] };
};


const routerNode = (state) => {
if(state.users.length > 0){
    return [END]
}else{
     return ['c']
}
};


const builder = new StateGraph(StateAnnotation)
  .addNode("a", nodeA)
  .addNode("b", nodeB)
  .addNode('c',nodeC)


  .addEdge(START, "a")
  .addConditionalEdges('a',routerNode)
  .addEdge("b", END)
  .addEdge("c", END)



const graph = builder.compile();
// Invoke the graph
const baseResult = await graph.invoke({ aggregate: [], users: ["albert"] });
console.log("Base Result: ", baseResult);

// Note :
// Explain what is a state
// How state change
// start node end Node
// 