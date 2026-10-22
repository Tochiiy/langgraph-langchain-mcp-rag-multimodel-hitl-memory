
// Review and edit state
// Sometimes you want to let a human review and edit part of the graph state before continuing. 
// This is useful for correcting LLMs, adding missing information, or making adjustments.


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
  generatedText: z.string(),
});

function nodeA(state){
    // Ask a reviewer to edit the generated content
    const updated = interrupt({
      instruction: "Review and edit this content",
      content: state.generatedText,
    });
    console.log('updated : ',updated)
    return { generatedText: updated };
}

const builder = new StateGraph(State)
  .addNode("review",nodeA )

  .addEdge(START, "review")
  .addEdge("review", END);

const checkpointer = new MemorySaver();
const graph = builder.compile({ checkpointer });

const config = { configurable: { thread_id: "review-42" } };
const initial = await graph.invoke({ generatedText: "Initial draft" }, config);
console.log(initial.__interrupt__);

// Resume with the edited text from the reviewer
const finalState = await graph.invoke(
  new Command({ resume: "Improved draft after review" }),
  config,
);
console.log(finalState.generatedText); // -> "Improved draft after review"