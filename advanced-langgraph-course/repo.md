# GraphRAG: The Upgrade That Stops Your AI From Losing the Plot

Ask a normal RAG system this:

> "How is our CEO connected to our biggest customer through past projects?"

And you'll get back a pile of paragraphs that all *sound* relevant — but no actual answer. Nothing connects the dots for you.

Ask **GraphRAG** the same question, and it hands you the chain: who worked where, which company acquired which, who sits where now. A connected story instead of a stack of similar-looking chunks.

That's the whole pitch of this post. Let's unpack it properly.

We'll cover:

- What GraphRAG actually is
- Why normal RAG falls apart on certain questions
- How GraphRAG builds its knowledge graph
- How it answers a question once that graph exists
- Local search vs. global search
- When GraphRAG is worth the cost — and when it isn't

*I'm Amit Shekhar, Founder @ Outcome School. I teach AI and Machine Learning, and I've mentored developers into high-paying tech roles, helped companies solve gnarly retrieval problems, and built open-source libraries used by top teams. Let's get into it.*

---

## What is GraphRAG?

GraphRAG = **Graph** + **RAG**.

The **Graph** part is a knowledge graph: every important *thing* in your documents — a person, a company, a product — becomes a node. Every relationship between two things becomes an edge connecting them.

The **RAG** part is Retrieval-Augmented Generation: fetch relevant information from your data, hand it to the LLM alongside the question, and let the model answer from real context instead of guessing.

Put simply:

> **GraphRAG is RAG that uses a knowledge graph to find better, more connected information before it ever generates an answer.**

Think of the knowledge graph as a small, private Wikipedia built from your own data — every important thing gets a page, and every link between two pages tells you exactly how they relate.

GraphRAG is one flavor of "advanced RAG." Another well-known one is Agentic RAG, where an agent decides on the fly what to retrieve and when. GraphRAG's specialty is different: it's built for questions that require *following connections*, not just finding similar text.

---

## Why normal RAG isn't enough

Before GraphRAG makes sense, you need to feel where plain RAG breaks.

Standard RAG, step by step:

1. Split documents into small chunks.
2. Embed each chunk as a vector.
3. Embed the user's question the same way.
4. Retrieve the chunks whose embeddings sit closest to the question.
5. Hand those chunks to the LLM as context.

This works great when the answer lives inside one or two chunks. It falls apart the moment it doesn't.

Say your documents mention dozens of people, companies, products, and events, and someone asks:

> "How is Person A connected to Company X through their work history?"

To answer that, something needs to:

1. Find Person A.
2. Find every company Person A has worked at.
3. Check which of those companies link to Company X.
4. Stitch all of that into one coherent answer.

Plain similarity search can't do this. It grabs chunks that *sound* like the question, but it never actually follows the thread between people, companies, and events — because the information is scattered across chunks that individually don't mention both entities together.

This is called a **multi-hop question** — answering it takes more than one hop across separate pieces of information.

The real problem: your information is connected like a web, but normal RAG treats every chunk like an isolated island. That gap is exactly what GraphRAG exists to close.

---

## The big picture of GraphRAG

GraphRAG runs in two phases:

- **Indexing phase** (runs once): read every document, extract entities and relationships, and build a knowledge graph out of them.
- **Query phase** (runs per question): look up the relevant part of the graph, walk the connections, gather the right information, and pass it to the LLM.

All the expensive work happens once, up front. Every question after that rides on top of a graph that's already built.

![GraphRAG big picture: indexing phase feeds the query phase](diagram-big-picture.svg)

Now let's decode each phase properly.

---

## How GraphRAG builds the knowledge graph

This is the indexing phase — it happens once, before anyone asks a single question.

Take a paragraph like this:

> "Alice worked at Acme as an engineer. Acme was acquired by Globex in 2020. Bob was the CEO of Globex at that time."

Plain RAG would just chunk this and store an embedding. GraphRAG does more — it uses an LLM to pull out two things:

- **Entities**: the important things mentioned — people, companies, dates, products. Here: Alice, Acme, Globex, Bob.
- **Relations**: how those entities connect — "works at," "acquired," "CEO of." Here: *Alice → works at → Acme*, *Globex → acquired → Acme*, *Bob → CEO of → Globex*.

![Example knowledge graph built from one paragraph: Alice, Acme, Globex, Bob](diagram-graph-example.svg)

Every entity becomes a node. Every relation becomes an edge connecting two nodes. GraphRAG repeats this across every chunk in your documents, and the same entity mentioned in different chunks gets merged into a single node — so everything about Globex, wherever it's mentioned, ends up in one place.

There's one more step: once the graph exists, GraphRAG groups tightly connected nodes into **communities** — clusters that share a theme, like "the Acme acquisition story" or "Bob's career." For each community, an LLM writes a short plain-English summary.

So after indexing, you're left with:

- A graph of entities and relations
- Embeddings for every entity, relation, chunk, and community summary
- Community summaries for each cluster of related entities

Recomputing all of those embeddings on every re-index gets expensive fast — worth reading up on how an **embedding cache** lets you skip anything that hasn't changed.

One thing worth stressing: GraphRAG doesn't throw away embeddings once the graph exists — it keeps both and uses them together. At query time, embeddings help you find the right entry point into the graph, and then you walk the connections from there.

*Want RAG, vector databases, and LLM fundamentals from the ground up? That's what we cover in the AI and Machine Learning Program at Outcome School.*

---

## How GraphRAG answers a question

This is the query phase — it runs every time someone asks something.

Say the question is:

> "How is Alice connected to Bob?"

GraphRAG handles it in four steps:

1. **Find starting points.** Embed the question, find the closest entities in the graph, and pick up anything mentioned directly. Here: Alice and Bob.
2. **Walk the connections.** From Alice → Acme. From Acme → Globex. From Globex → Bob. A path emerges.
3. **Collect context along that path** — nodes, edges, original text chunks, and any relevant community summaries.
4. **Generate the answer**, with all of that passed to the LLM alongside the original question.

The result reads like this:

> "Alice worked at Acme. Acme was later acquired by Globex, where Bob was the CEO. So Alice is connected to Bob through the Acme–Globex acquisition."

That answer pulls from three separate sentences in the source material and stitches them into one coherent chain — something plain RAG structurally can't do, because no single chunk contains the whole story.

GraphRAG doesn't just find similar text. It walks relationships and comes back with a connected narrative.

A quick aside: whatever corner of AI engineering you work in, these are worth having a solid grip on — LLMs, RAG, MCP, agents, fine-tuning, and quantization. We put all five together in one video: *[AI Engineering Explained: LLM, RAG, MCP, Agent, Fine-Tuning, and Quantization]*. Bookmark it for later if now's not the time.

---

## Local search vs. global search

GraphRAG gives you two different ways to search the graph, depending on the shape of the question.

**Local search** — for questions about a specific entity or a small corner of the graph.

> "What is Alice's role at Acme?"

Here you only need the neighborhood around Alice and Acme: a small subgraph, plus the connected text chunks, passed straight to the LLM.

**Global search** — for questions about the *whole* dataset that need a high-level view.

> "What are the major themes across all our company documents?"

No single subgraph answers this. GraphRAG instead leans on the community summaries built during indexing, in two steps:

- **Map step**: every community summary gets a small partial answer from the LLM, in parallel, each with a relevance score.
- **Reduce step**: the highest-scoring partial answers get combined into one final answer.

This map-then-reduce approach is what lets global search scale across thousands of communities without blowing past the context window.

In short:

- **Local search** = zoom in on one part of the graph.
- **Global search** = zoom out, ask every community a small question (map), then merge the answers (reduce).

*If you want to go deep on RAG, context engineering, embeddings, and vector databases, we've built a full program around it — the AI and Machine Learning Program at Outcome School.*

---

## When to use GraphRAG

GraphRAG isn't the default choice — it earns its keep when:

- Your documents are full of connected entities: people, products, companies, events.
- Users ask questions that need information stitched together from multiple chunks.
- Users ask big-picture questions about the whole dataset, not one isolated fact.
- Your data is naturally relationship-rich: research papers, legal filings, company knowledge bases, news archives.

Concrete example: a law firm holding thousands of court cases, judgments, and contracts gets asked, "Which judges have ruled in our favor on IP cases involving our top three clients?" Answering that means connecting judges, cases, rulings, and clients across a huge document set. Plain RAG has no mechanism for that. GraphRAG does.

If your use case is simpler — one chunk usually contains the whole answer — plain RAG is faster, cheaper, and good enough. Don't reach for the graph you don't need.

---

## Trade-offs of GraphRAG

Power comes with a bill:

- **Indexing is expensive.** Building the graph takes many LLM calls to extract entities, relations, and community summaries.
- **Storage is heavier.** You're storing the graph, embeddings, *and* summaries — not just chunks.
- **Updates aren't free.** New documents mean updating the graph and summaries, not just appending to a vector store.
- **Engineering gets more complex.** Now you're maintaining a graph structure alongside your vector store, not instead of it.

Here's the comparison at a glance:

| Aspect | Normal RAG | GraphRAG |
|---|---|---|
| Retrieval style | Similarity search on chunks | Walk a knowledge graph + similarity search |
| Best for | Single-fact questions | Multi-hop and high-level questions |
| Indexing cost | Low | High (many LLM calls) |
| Storage | Vector store of chunks | Graph + vectors + community summaries |
| Engineering effort | Simple | More complex |
| Answer quality on connected data | Limited | Much better |

My honest take: GraphRAG earns its cost only when your data is genuinely relationship-rich *and* your users are actually asking multi-hop questions. Everything else — start with plain RAG.

---

## Quick summary

- **GraphRAG = Graph + RAG** — retrieval that uses a knowledge graph alongside vector search.
- **Normal RAG's limitation**: it can't follow connections across chunks, so multi-hop questions break it.
- **Indexing phase**: an LLM extracts entities and relations, builds the graph, and writes community summaries.
- **Query phase**: find starting entities by embedding similarity, walk the graph, gather nodes/edges/chunks/summaries, and send it all to the LLM.
- **Local search**: zoom in on a specific area of the graph.
- **Global search**: zoom out, map across community summaries, then reduce to one answer.
- **When to use it**: connection-rich data, questions that span multiple entities.
- **Trade-off**: much better answers, at the cost of indexing time, storage, and engineering complexity.

*Prepping for an AI engineering interview? [AI Engineering Interview Questions] is worth a look.*

That's it for now — thanks for reading.
