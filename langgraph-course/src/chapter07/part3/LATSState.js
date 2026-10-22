import { END, START, StateGraph, Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { ChatCerebras } from "@langchain/cerebras";
import { z } from "zod";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

// 1. Define the LATS State
const LATSState = Annotation.Root({
  ...MessagesAnnotation.spec,
  topic: Annotation({ default: () => "" }),
  // Array of potential "nodes" (candidate branches)
  candidates: Annotation({
    default: () => [],
    reducer: (x, y) => y // Replace candidates each iteration
  }),
  best_candidate: Annotation({ default: () => null })
});

const model = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0.8, // Higher for diverse expansion
  apiKey: process.env.CEREBRAS_API_KEY,
});

/**
 * NODE 1: EXPANSION
 * Generates 3 different "branches" (titles + hooks) for the blog.
 */
const expansionNode = async (state) => {
  const schema = z.object({
    branches: z.array(z.object({
      title: z.string(),
      hook: z.string(),
      angle: z.enum(["Controversial", "Educational", "Listicle"])
    })).length(3)
  });

  const structuredLlm = model.withStructuredOutput(schema);
  const result = await structuredLlm.invoke([
    new SystemMessage("Generate 3 distinct creative angles for a blog post."),
    new HumanMessage(`Topic: ${state.topic}`)
  ]);

  return { candidates: result.branches };
};

/**
 * NODE 2: EVALUATION (The "Value Function")
 * Scores each branch and picks the winner based on severe critique.
 */
const evaluationNode = async (state) => {
  const schema = z.object({
    scores: z.array(z.number().min(0).max(10)),
    reasoning: z.string(),
    winner_index: z.number()
  });

  const evaluator = model.withStructuredOutput(schema);

  const formattedCandidates = state.candidates.map((c, i) =>
    `[${i}] Angle: ${c.angle} | Title: ${c.title} | Hook: ${c.hook}`
  ).join("\n");

  const result = await evaluator.invoke([
    new SystemMessage("You are a severe SEO and engagement editor. Score these 3 candidates and pick the one with the highest viral potential."),
    new HumanMessage(`Candidates:\n${formattedCandidates}`)
  ]);

  return { best_candidate: state.candidates[result.winner_index] };
};

/**
 * NODE 3: REFINEMENT (The Final "Path")
 * Takes the winning branch and polishes it.
 */
const refinementNode = async (state) => {
  const best = state.best_candidate;

  const result = await model.invoke([
    new SystemMessage("Refine this winning blog hook. Ensure it is punchy and under 50 words."),
    new HumanMessage(`Angle: ${best.angle}\nTitle: ${best.title}\nDraft Hook: ${best.hook}`)
  ]);

  return { messages: [new AIMessage({ content: result.content })] };
};

// 3. Build the Graph
const builder = new StateGraph(LATSState)
  .addNode("expand", expansionNode)
  .addNode("evaluate", evaluationNode)
  .addNode("refine", refinementNode)

  .addEdge(START, "expand")
  .addEdge("expand", "evaluate")
  .addEdge("evaluate", "refine")
  .addEdge("refine", END);

const graph = builder.compile();

// Execution
const result = await graph.invoke({
  topic: "The impact of LangGraph on Autonomous AI Agents"
});

console.log("WINNING HOOK:", result.messages[result.messages.length - 1].content);
