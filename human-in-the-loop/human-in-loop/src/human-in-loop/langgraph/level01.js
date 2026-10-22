
// handling multiple interrupts


import {
  Annotation,
  Command,
  END,
  INTERRUPT,
  MemorySaver,
  START,
  StateGraph,
  interrupt,
  isInterrupted,
} from "@langchain/langgraph";

const State = Annotation.Root({
  vals: Annotation({
    reducer: (left, right) =>
      left.concat(Array.isArray(right) ? right : [right]),
    default: () => [],
  }),
});

function nodeA(_state) {
  console.log('_state_val  : ',_state)
  const answer = interrupt("Enter Input #1")
  // run the logic 
  console.log("========ask agent to run file_delete tool ===========")
  return { vals: [`a:${answer}`] };
}

function nodeB(_state) {
  const answer = interrupt("Enter Input #2")
   console.log("========ask agent to run file_write tool===========")
  return { vals: [`b:${answer}`] };
}

const graph = new StateGraph(State)
  .addNode("a", nodeA)
  .addNode("b", nodeB)

  .addEdge(START, "a")
  .addEdge(START, "b")

  .addEdge("a", END)
  .addEdge("b", END)
  .compile({ checkpointer: new MemorySaver() });

const config = { configurable: { thread_id: "1" } };

async function main() {
  // Step 1: invoke - both parallel nodes hit interrupt() and pause
  const interruptedResult = await graph.invoke({ vals: ["ben","john"] }, config);
  // console.log(interruptedResult);
  /*
  {
    vals: [],
    __interrupt__: [
      { id: '...', value: 'question_a' },
      { id: '...', value: 'question_b' }
    ]
  }
  */

  // Step 2: resume all pending interrupts at once
  // const resumeMap = {};
  // if (isInterrupted(interruptedResult)) {
  //   for (const i of interruptedResult["__interrupt__"]) {
  //     if (i.id != null) {
  //       resumeMap[i.id] = `answer for ${i.value}`;
  //     }
  //   }
  // }
  // const result = await graph.invoke(new Command({ resume: resumeMap }), config);

  // console.log("Final state:", result);
  //> Final state: { vals: ['a:answer for question_a', 'b:answer for question_b'] }
}

main().catch(console.error);