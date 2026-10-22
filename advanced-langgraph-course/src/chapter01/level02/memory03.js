
// Semantic vector store 

import { OpenAIEmbeddings } from "@langchain/openai";
import { InMemoryStore } from "@langchain/langgraph";
import { CohereEmbeddings } from "@langchain/cohere";
import "dotenv/config";
// Create store with semantic search enabled
// cohere
const embeddings = new CohereEmbeddings({
    model: "embed-english-v3.0",
    apiKey: process.env.COHERE_API_KEY,
});


const store = new InMemoryStore({
  index: {
    embeddings,
    dims: 1536,
  },
});



const namespace=["user_123", "memories"]

await store.put(namespace, "doc1", { text: "I love pizza" });
await store.put(namespace, "doc2", { text: "I am a plumber" });
 await store.put(namespace, "doc3", { text: "TypeScript guide" });

const items = await store.search(namespace, {
  query: "pizza",
  limit: 1,
});

console.log("items :",items)