import {
  END,
  START,
  StateGraph,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";
import { createAgent } from "langchain";
import { z } from "zod";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Document } from "@langchain/core/documents";


import { tool } from "@langchain/core/tools";
import { ChatCerebras } from "@langchain/cerebras";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";
import { ReflectionSchema, AnswerQuestionSchema, ReviseAnswerSchema } from "./schema.js"
import "dotenv/config";


const model = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0.7,
  apiKey: process.env.CEREBRAS_API_KEY,
});


const ReflexionState = Annotation.Root({
  ...MessagesAnnotation.spec,
  current_step: Annotation({ default: () => null }),
  // Reducer to accumulate search results across iterations
  search_results: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => []
  })
});


const initialNode = async (state) => {
  const structuredLlm = model.withStructuredOutput(AnswerQuestionSchema);

  const systemPrompt = `You are expert researcher.
Current time: ${new Date().toISOString()}

1. Provide a detailed ~250 word answer.
2. Reflect and critique your answer. Be severe to maximize improvement.
3. Recommend search queries to research information and improve your answer.`;

  const response = await structuredLlm.invoke([
    { role: "system", content: systemPrompt },
    ...state.messages,
    { role: "user", content: "Reflect on the original question" }
  ]);

  return {
    current_step: response,
    messages: [new AIMessage({ content: response.answer })]
  };
};

const revisionNode = async (state) => {
  const structuredLlm = model.withStructuredOutput(ReviseAnswerSchema);

  // Format the search results into a readable string for the LLM

  const systemPrompt = `You are an expert researcher. 
Current time: ${new Date().toISOString()}

NEW RESEARCH DATA:

<search_data>
${state.search_results.join("\n")}
</search_data>

YOUR TASK:
1. Revise your previous answer using the NEW RESEARCH DATA above.
2. Address these specific gaps: <gaps_to_address>${state.current_step.reflection.missing}</gaps_to_address>.
3. Remove these superfluous parts: <superfluous_content>${state.current_step.reflection.superfluous}</superfluous_content>.
4. Use numerical citations like [1], [2] based on the sources provided.
5. Provide a new critique and further search queries if the answer still isn't perfect.`;

  const response = await structuredLlm.invoke([
    { role: "system", content: systemPrompt },
    ...state.messages,
    { role: "user", content: "Update the answer using the provided research. Respond using ReviseAnswer." }
  ]);

  return {
    current_step: response,
    messages: [new AIMessage({ content: response.answer })]
  };
};


const executeSearchNode = async (state) => {
  const queries = state.current_step.search_queries;


  const client = new Exa(process.env.EXA_SEARCH_API_KEY);
  const searchTool = tool(
    async ({ query }) => {

      const exaTool = new ExaSearchResults({
        client,
        searchArgs: {
          numResults: 1,
          type: "auto",
        },
      })

      const result = await exaTool.invoke(query);
      return result

    },
    {
      name: "search_web",
      description: "Search the web  to find real-time information.",
      schema: z.object({
        query: z.string(),
      }),
    }
  );

  const rawResults = []
  for (const query of queries) {
    const result = await searchTool.invoke({ query })
    rawResults.push(result)
  }



  return { search_results: [...rawResults] };
};

const builder = new StateGraph(ReflexionState)
  .addNode("initialNode", initialNode)
  .addNode("search", executeSearchNode) // New node to run Tavily
  .addNode("revise", revisionNode)

  .addEdge(START, "initialNode")
  .addEdge("initialNode", "search")
  .addEdge("search", "revise")

  .addEdge("initialNode", END)


const graph = builder.compile();

const result = await graph.invoke({
  messages: [

    new HumanMessage({ content: "What is Prompt Engineering ?" }),

  ],
});
console.log("graph state==================", result);