# Core Concepts

## Graph State Definition

### MessagesAnnotation Example

The `Annotation` function is the recommended way to define your graph state for new `StateGraph` graphs. Here's a basic example using messages:

```typescript
import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

const GraphAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (currentState, updateValue) => currentState.concat(updateValue),
    default: () => [],
  }),
});
```

### Custom State with Annotation.Root

You can define custom state structures using `Annotation.Root` with multiple channels. Each channel can optionally have `reducer` and `default` functions:

```typescript
const QuestionAnswerAnnotation = Annotation.Root({
  question: Annotation<string>(),
  answer: Annotation<string>(),
});
```

### State Reducers and Merging Strategies

The `reducer` function defines how new values are combined with the existing state. The `default` function provides an initial value for the channel:

```typescript
const GraphAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (currentState, updateValue) => currentState.concat(updateValue),
    default: () => [],
  }),
});
```

You can merge multiple annotations using the `spec` property:

```typescript
const MergedAnnotation = Annotation.Root({
  ...QuestionAnswerAnnotation.spec,
  ...GraphAnnotation.spec,
});
```

## Basic Graph Construction

### StateGraph Initialization

Instantiate your graph by passing the annotation to the `StateGraph` constructor:

```typescript
import { StateGraph } from "@langchain/langgraph";

const workflow = new StateGraph(GraphAnnotation);
```

### Adding Nodes and Edges

Add nodes and edges to define your workflow structure:

```typescript
workflow.addNode("nodeA", nodeAFunction);
workflow.addNode("nodeB", nodeBFunction);
workflow.addEdge("nodeA", "nodeB");
```

### START and END Usage

Use special `START` and `END` constants for entry and exit points:

```typescript
import { START, END } from "@langchain/langgraph";

workflow.addEdge(START, "nodeA");
workflow.addEdge("nodeB", END);
```

### Graph Compilation

Compile the graph before execution:

```typescript
const app = workflow.compile();
```

## Node Implementation Patterns

### Simple Node Functions

Node functions receive the current state and return updates:

```typescript
function simpleNode(state: typeof GraphAnnotation.State) {
  return {
    messages: [new HumanMessage("Hello from simple node")]
  };
}
```


### Node Retry Policies

Configure retry policies for nodes that may fail:

```typescript
workflow.addNode("retryableNode", retryableFunction, {
  retryPolicy: {
    initialInterval: 1000,
    backoffFactor: 2,
    maxInterval: 10000,
    maxAttempts: 3,
  },
});
```

### Node Caching

Cache expensive node operations with TTL configuration:

```typescript
workflow.addNode("expensiveNode", expensiveFunction, {
  cachePolicy: {
    ttl: 300,
    keySerializer: (state) => JSON.stringify(state.input),
  },
});
```

### Deferred Node Execution

Defer node execution until all other pending tasks complete:

```typescript
workflow.addNode("deferredNode", deferredFunction, {
  defer: true,
});
```

## References

For more detailed information and advanced usage patterns, refer to the official LangGraphJS documentation:

### Graph State Definition
- [How to define graph state](https://langchain-ai.github.io/langgraphjs/how-tos/define-state/) - Complete guide to state definition with Annotation.Root
- [Have a separate input and output schema](https://langchain-ai.github.io/langgraphjs/how-tos/input_output_schema/) - Separating input/output schemas for better type safety
- [Pass private state between nodes inside the graph](https://langchain-ai.github.io/langgraphjs/how-tos/pass_private_state/) - Managing private state that doesn't persist in main graph state

### Basic Graph Construction
- [How to define graph state](https://langchain-ai.github.io/langgraphjs/how-tos/define-state/) - StateGraph initialization and basic construction patterns

### Node Implementation Patterns
- [How to add node retries](https://langchain-ai.github.io/langgraphjs/how-tos/node-retry-policies/) - Configuring retry policies for resilient node execution
- [How to cache expensive nodes](https://langchain-ai.github.io/langgraphjs/how-tos/node-caching/) - Implementing caching strategies with TTL configuration
- [How to defer node execution](https://langchain-ai.github.io/langgraphjs/how-tos/defer-node-execution/) - Deferring node execution until other tasks complete
