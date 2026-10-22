


// Approve or reject
// One of the most common uses of interrupts is to pause before a critical action and ask for approval. 
// For example, you might want to ask a human to approve an API call, 
// a database change, or any other important decision.

import {
  Command,
  MemorySaver,
  START,
  END,
  StateGraph,
  StateSchema,
  interrupt,
} from "@langchain/langgraph";
import * as z from "zod";

const State = new StateSchema({
  actionDetails: z.string(),
  status: z.enum(["pending", "approved", "rejected"]).nullable(),
});


function nodeA(state){
    const decision = interrupt({
      question: "Approve this action?",
      details: state.actionDetails,
    });
    // decision :  true
    console.log("decision : ",decision)
    return new Command({ goto: decision ? "proceed" : "cancel" });
}

function nodeB(state){
  return {status:"approved"}
}
function nodeC(state){
  return {status:"rejected"}
}


const graphBuilder = new StateGraph(State)
  .addNode("approval", nodeA, { ends: ['proceed', 'cancel'] })

  .addNode("proceed", nodeB)
  .addNode("cancel", nodeC)

  .addEdge(START, "approval")
  .addEdge("proceed", END)
  .addEdge("cancel", END);

// Use a more durable checkpointer in production
const checkpointer = new MemorySaver();
const graph = graphBuilder.compile({ checkpointer });



const config = { configurable: { thread_id: "approval-123" } };
const initial = await graph.invoke(
  { actionDetails: "Transfer $500", status: "pending" },
  config,
);
console.log(initial.__interrupt__);
// [
//   {
//     id: 'bb5a35d8c96becca10733fdc8e130db8',
//     value: { question: 'Approve this action?', details: 'Transfer $500' }
//   }
// ]
// Resume with the decision; true routes to proceed, false to cancel
const resumed = await graph.invoke(new Command({ resume: true }), config);
// console.log(resumed.status); // -> "approved"