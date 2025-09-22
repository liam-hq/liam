# Control Flow

## Branching for Parallel Execution

### Basic Parallel Branches

LangGraph supports fan-out and fan-in patterns for parallel execution. You can create branches that execute multiple nodes simultaneously:

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";

const workflow = new StateGraph(GraphAnnotation);

workflow.addNode("nodeA", nodeAFunction);
workflow.addNode("nodeB", nodeBFunction);
workflow.addNode("nodeC", nodeCFunction);
workflow.addNode("nodeD", nodeDFunction);

// Fan-out: START connects to multiple nodes
workflow.addEdge(START, "nodeA");
workflow.addEdge(START, "nodeB");

// Fan-in: Multiple nodes connect to one node
workflow.addEdge("nodeA", "nodeC");
workflow.addEdge("nodeB", "nodeC");

workflow.addEdge("nodeC", "nodeD");
workflow.addEdge("nodeD", END);
```

### Multiple Entry Points

Define multiple entry points for different execution paths:

```typescript
workflow.addEdge(START, "entryA");
workflow.addEdge(START, "entryB");
```


## Map-Reduce Pattern

### Map-Reduce Workflow Setup

Implement map-reduce patterns using the `Send` API for distributing work across parallel nodes:

```typescript
import { Send } from "@langchain/langgraph";

function mapFunction(state: typeof GraphAnnotation.State) {
  const items = state.items;
  return items.map((item, index) => 
    new Send("processItem", { item, index })
  );
}

workflow.addNode("map", mapFunction);
workflow.addNode("processItem", processItemFunction);
workflow.addNode("reduce", reduceFunction);

workflow.addConditionalEdges("map", mapFunction, ["processItem"]);
workflow.addEdge("processItem", "reduce");
```


## Conditional Routing

### Dynamic Routing Based on State

Use conditional edges to route execution based on state values with `addConditionalEdges`.


## Recursion Limits and Loop Control

### Recursion Limit Configuration

Configure recursion limits to prevent infinite loops by passing `recursionLimit` in the config when invoking the graph:

```typescript
import { GraphRecursionError } from "@langchain/langgraph";

try {
  await graph.invoke(inputs, { recursionLimit: 4 });
} catch (error) {
  if (error instanceof GraphRecursionError) {
    console.log("Recursion Error");
  } else {
    throw error;
  }
}
```


## Command Pattern for Control Flow


### Deferred Node Execution

Defer node execution until all other pending tasks are completed:

```typescript
workflow.addNode("deferredNode", deferredFunction, {
  defer: true
});
```

## References

For more detailed information and advanced usage patterns, refer to the official LangGraphJS documentation:

### Branching and Parallel Execution
- [How to create branches for parallel execution](https://langchain-ai.github.io/langgraphjs/how-tos/branching/) - Complete guide to fan-out/fan-in patterns and conditional branching

### Map-Reduce Pattern
- [How to create map-reduce branches for parallel execution](https://langchain-ai.github.io/langgraphjs/how-tos/map-reduce/) - Implementing map-reduce workflows with the Send API

### Recursion and Loop Control
- [How to create and control loops with recursion limits](https://langchain-ai.github.io/langgraphjs/how-tos/recursion-limit/) - Managing recursion limits and preventing infinite loops

### Command Pattern for Control Flow
- [How to combine control flow and state updates with Command](https://langchain-ai.github.io/langgraphjs/how-tos/command/) - Using Command objects for advanced flow control

### Additional Control Flow
- [How to defer node execution](https://langchain-ai.github.io/langgraphjs/how-tos/defer-node-execution/) - Deferring execution until other pending tasks complete
