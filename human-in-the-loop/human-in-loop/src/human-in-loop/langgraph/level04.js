// Validating human input

// Full-example 
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
  age: z.number().nullable(),
});


function nodeA(state){
    let prompt = "What is your age?";

    while (true) {
      const answer = interrupt(prompt); // payload surfaces in result.__interrupt__

      if (typeof answer === "number" && answer > 0) {
        return { age: answer };
      }

      prompt = `'${answer}' is not a valid age. Please enter a positive number.`;
    }
}
const builder = new StateGraph(State)
  .addNode("collectAge",)
  .addEdge(START, "collectAge")
  .addEdge("collectAge", END);

const checkpointer = new MemorySaver();
const graph = builder.compile({ checkpointer });

const config = { configurable: { thread_id: "form-1" } };
const first = await graph.invoke({ age: null }, config);
console.log(first.__interrupt__); // -> [{ value: "What is your age?", ... }]

// Provide invalid data; the node re-prompts
const retry = await graph.invoke(new Command({ resume: "thirty" }), config);
console.log(retry.__interrupt__); // -> [{ value: "'thirty' is not a valid age...", ... }]

// Provide valid data; loop exits and state updates
const final = await graph.invoke(new Command({ resume: 30 }), config);
console.log(final.age); // -> 30