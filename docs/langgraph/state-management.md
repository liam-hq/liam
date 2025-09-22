# State Management

## State Schema Design

### Using Annotation for State Definition

The `Annotation` function is the recommended way to define your graph state for new `StateGraph` graphs. The `Annotation.Root` function creates the top-level state object:

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

### Input/Output Schema Separation

Define separate input and output schemas for your graph using different annotation objects:

```typescript
const InputAnnotation = Annotation.Root({
  question: Annotation<string>(),
});

const OutputAnnotation = Annotation.Root({
  answer: Annotation<string>(),
});

const GraphAnnotation = Annotation.Root({
  ...InputAnnotation.spec,
  ...OutputAnnotation.spec,
});
```


### Private State Between Nodes

You can pass state between nodes that should NOT be part of the main schema of the graph. This is useful for intermediate working logic that doesn't need to be in the main input/output schema.

Here's an example of a RAG pipeline that uses private state for search queries and documents:

```typescript
import { Annotation, StateGraph } from "@langchain/langgraph";

// The overall state of the graph
const OverallStateAnnotation = Annotation.Root({
  question: Annotation<string>,
  answer: Annotation<string>,
});

// This is what the node that generates the query will return
const QueryOutputAnnotation = Annotation.Root({
  query: Annotation<string>,
});

// This is what the node that retrieves the documents will return
const DocumentOutputAnnotation = Annotation.Root({
  docs: Annotation<string[]>,
});

// This is what the node that retrieves the documents will return
const GenerateOutputAnnotation = Annotation.Root({
  ...OverallStateAnnotation.spec,
  ...DocumentOutputAnnotation.spec
});

// Node to generate query
const generateQuery = async (state: typeof OverallStateAnnotation.State) => {
  return {
    query: state.question + " rephrased as a query!",
  };
};

// Node to retrieve documents
const retrieveDocuments = async (state: typeof QueryOutputAnnotation.State) => {
  return {
    docs: [state.query, "some random document"],
  };
};

// Node to generate answer
const generate = async (state: typeof GenerateOutputAnnotation.State) => {
  return {
    answer: state.docs.concat([state.question]).join("\n\n"),
  };
};

const graph = new StateGraph(OverallStateAnnotation)
  .addNode("generate_query", generateQuery)
  .addNode("retrieve_documents", retrieveDocuments, {input: QueryOutputAnnotation})
  .addNode("generate", generate, {input: GenerateOutputAnnotation})
  .addEdge("__start__", "generate_query")
  .addEdge("generate_query", "retrieve_documents")
  .addEdge("retrieve_documents", "generate")
  .compile();
```

The intermediate states populated by the `input` annotations are not present in the final output, keeping the main schema clean.

## State Updates and Merging


### State Validation

Ensure type safety by passing the annotation to the `StateGraph` constructor:

```typescript
import { StateGraph } from "@langchain/langgraph";

const workflow = new StateGraph(GraphAnnotation);
```


## State Persistence Patterns

### Thread-level Persistence

Add thread-level persistence using checkpointers:

```typescript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const graph = workflow.compile({ checkpointer });
```


### PostgreSQL Persistence

Use PostgreSQL for production persistence:

```typescript
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const checkpointer = PostgresSaver.fromConnString("postgresql://...");
const graph = workflow.compile({ checkpointer });
```


## References

For more detailed information and advanced usage patterns, refer to the official LangGraphJS documentation:

### State Schema Design
- [How to define graph state](https://langchain-ai.github.io/langgraphjs/how-tos/define-state/) - Complete guide to state definition with Annotation.Root and custom reducers
- [Have a separate input and output schema](https://langchain-ai.github.io/langgraphjs/how-tos/input_output_schema/) - Separating input/output schemas for better type safety
- [Pass private state between nodes inside the graph](https://langchain-ai.github.io/langgraphjs/how-tos/pass_private_state/) - Managing private state between nodes

### State Persistence Patterns
- [How to add thread-level persistence to your graph](https://langchain-ai.github.io/langgraphjs/how-tos/persistence/) - Basic persistence with checkpointers like MemorySaver
- [How to use a Postgres checkpointer for persistence](https://langchain-ai.github.io/langgraphjs/how-tos/persistence-postgres/) - Production-ready PostgreSQL persistence
