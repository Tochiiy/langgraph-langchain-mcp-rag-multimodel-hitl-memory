npx @modelcontextprotocol/inspector node mcp-server.js
npx @playwright/mcp@latest --port 8931


INSTALLATION GUIDE FOR MICRO SANDBOX




https://wikidocs.net/267814



import { MessagesAnnotation, StateGraph, END, START, Command } from "@langchain/langgraph";

async function createManagedNode({ name, systemPrompt, nextNode, agentTools = [] }) {
  // Use v1 createAgent (prebuilt)
  const agent = createAgent({
     model,
    tools: agentTools,
   systemPrompt
  });

    const result = await agent.invoke(state);
    const lastMsg = result.messages[result.messages.length - 1];

    // Check if the agent wants to hand off to the next level
    // In a conversational flow, the agent might say "I'm passing this to Agent B"
    const shouldHandoff = nextNode && (
        lastMsg.content.includes("TRANSFER") || 
        lastMsg.content.includes("delegate")
    );

    if (shouldHandoff) {
      return new Command({
        update: { messages: [lastMsg] },
        goto: nextNode,
      });
    }

  
}


// 2. Worker-B: The Powerhouse (Browsing, Coding, Research)
const agentB = createManagedNode({
  name: "Worker-B",
  systemPrompt: `You are the Lead Technical Worker. 
  You have full capabilities for:
  - **Research**: Search the web for real-time data.
  - **Coding**: Write and explain complex code.
  - **Execution**: Solve the user's problem directly.
  - If the task requires extreme niche specialization (e.g. legal/medical/deep-math), include the word 'TRANSFER' to call Agent-C.
  - Otherwise, produce the final result and finish. Stream your full 2k+ token response directly.`,
  nextNode: "__end__",
  agentTools: [] // Worker-B has the tools
});

// const agentB = createManagedNode({
//   name: "Worker-B",
//   systemPrompt: "You are Worker-B. If you need a specialist, say 'CALL_NEXT'. Otherwise, write it.",
//   nextNode: "agentC"
// });

// const agentC = createManagedNode({
//   name: "Specialist-C",
//   systemPrompt: "You are Specialist-C. Finish the task with a 2000-word report.",
//   nextNode: null
// });

// 2. Build the Workflow
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agentA", agentA)
  .addNode("agentB", agentB)
//   .addNode("agentC", agentC)
  .addEdge(START, "agentA")
  .addEdge("agentA","agentB")
  .addEdge("agentB",END)

const graph = workflow.compile();

