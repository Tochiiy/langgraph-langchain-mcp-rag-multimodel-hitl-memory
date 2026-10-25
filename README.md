# LangGraph · LangChain · MCP · RAG · Multi-Model · HITL

A collection of course-work, experiments and projects around **LangGraph, LangChain.js, MCP (Model Context Protocol), RAG pipelines, multi-model apps and Human-in-the-Loop (HITL)** — mostly JavaScript/TypeScript with some Python notebooks.

## Project layout

| Folder | Contents |
|---|---|
| `advanced-langgraph-course/` | Advanced LangGraph course — checkpoints/persistence, memory, subgraphs, error handling (JS) |
| `langgraph-course/` | LangGraph core course (chapters 02–08, JS) |
| `langchain-full-course/` | LangChain.js full course — agents, guardrails, middleware, runnable chains |
| `RAG-full-course-with-langchain/` | Full RAG course — embedding pipelines, retrievers, agentic RAG, adaptive + self-reflective RAG |
| `chatpdf-rag/` | Chat-with-PDF app (Next.js + RAG) |
| `multi-model-rag/` | Multi-model RAG — Next.js frontend + Node.js MCP server |
| `human-in-the-loop/` | HITL patterns in LangChain & LangGraph (levels 01–04) |
| `mcp-client-and-servers/` | LangChain MCP client/server examples |
| `multi-agent-system-mcp-supervisor-guardrails-hitl/` | Multi-agent system with MCP supervisor, guardrails & HITL (Python/FastAPI) |
| `Complete-Agentic-AI-Course-main/` | Agentic AI course clone — RAG variants (CRAG, Self-RAG, Graph-RAG), LangGraph notebooks, interview prep |
| `notes/` | Local personal notes/diagrams (not committed) |

## Tech stack

- **JS/TS:** LangChain.js, LangGraph.js, Next.js, MCP SDK
- **Python:** LangChain, LangGraph, Pydantic, FastAPI, notebooks (Jupyter)
- **Vector stores:** FAISS, Pinecone, Chroma

## Getting started

Each project folder is self-contained with its own `package.json` or `requirements.txt`.

```bash
# JS/TS projects
cd <project>
npm install

# Python projects
pip install -r requirements.txt
```

## Setup

Create a `.env` file in any project you run (never commit these):

```env
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
GROQ_API_KEY=...
TAVILY_API_KEY=...
PINECONE_API_KEY=...
LANGSMITH_API_KEY=...
```



