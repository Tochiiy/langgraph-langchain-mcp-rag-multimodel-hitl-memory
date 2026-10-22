Interrupts allow you to pause graph execution at specific points and wait for 
external input before continuing. 



## Pause using interrupt

The interrupt function pauses graph execution and returns a value to the caller. When you call interrupt within a node, LangGraph saves the current graph state and waits for you to resume execution with input.

## To use interrupt, you need:

1. A checkpointer to persist the graph state (use a durable checkpointer in production)
2. A thread ID in your config so the runtime knows which state to resume from
2. To call interrupt() where you want to pause (payload must be JSON-serializable)