# Advanced Features

## Subgraphs

### How to Add and Use Subgraphs

Subgraphs allow you to compose complex workflows by embedding one graph within another. This is useful for creating modular, reusable components and organizing complex logic.

#### Basic Subgraph Usage

```typescript
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

// Define the parent graph state
const ParentState = Annotation.Root({
  user_input: Annotation<string>,
  final_response: Annotation<string>
});

// Define the subgraph state (can share keys with parent)
const SubgraphState = Annotation.Root({
  user_input: Annotation<string>,
  processed_data: Annotation<string>
});

// Create subgraph nodes
function processInput(state: typeof SubgraphState.State) {
  return {
    processed_data: `Processed: ${state.user_input}`
  };
}

// Create the subgraph
const subgraph = new StateGraph(SubgraphState)
  .addNode("process", processInput)
  .addEdge(START, "process")
  .addEdge("process", END)
  .compile();

// Parent graph node that uses the subgraph
async function callSubgraph(state: typeof ParentState.State) {
  const result = await subgraph.invoke({ user_input: state.user_input });
  return {
    final_response: result.processed_data
  };
}

// Create the parent graph
const parentGraph = new StateGraph(ParentState)
  .addNode("subgraph_node", callSubgraph)
  .addEdge(START, "subgraph_node")
  .addEdge("subgraph_node", END)
  .compile();
```

#### Subgraphs with Different Schemas

When the subgraph state is completely independent from the parent graph state:

```typescript
// Parent graph state
const ParentState = Annotation.Root({
  messages: Annotation<string[]>
});

// Child graph state (completely different)
const ChildState = Annotation.Root({
  aggregate: Annotation<string[]>
});

// Grandchild graph state
const GrandchildState = Annotation.Root({
  name: Annotation<string>,
  path: Annotation<string[]>
});

// Grandchild graph nodes
function grandchildNode1(state: typeof GrandchildState.State) {
  return { path: [...state.path, "grandchild_1"] };
}

function grandchildNode2(state: typeof GrandchildState.State) {
  return { path: [...state.path, "grandchild_2"] };
}

// Create grandchild graph
const grandchildGraph = new StateGraph(GrandchildState)
  .addNode("grandchild_1", grandchildNode1)
  .addNode("grandchild_2", grandchildNode2)
  .addEdge(START, "grandchild_1")
  .addEdge("grandchild_1", "grandchild_2")
  .addEdge("grandchild_2", END)
  .compile();

// Child graph node that calls grandchild
async function childNode(state: typeof ChildState.State) {
  const result = await grandchildGraph.invoke({
    name: "test",
    path: []
  });
  return {
    aggregate: [...state.aggregate, `Path: ${result.path.join(" -> ")}`]
  };
}

// Create child graph
const childGraph = new StateGraph(ChildState)
  .addNode("child_node", childNode)
  .addEdge(START, "child_node")
  .addEdge("child_node", END)
  .compile();

// Parent graph node
async function parentNode(state: typeof ParentState.State) {
  const result = await childGraph.invoke({ aggregate: [] });
  return {
    messages: [...state.messages, ...result.aggregate]
  };
}

// Create parent graph
const parentGraph = new StateGraph(ParentState)
  .addNode("parent_node", parentNode)
  .addEdge(START, "parent_node")
  .addEdge("parent_node", END)
  .compile();
```

### How to View and Update State in Subgraphs

You can manage and inspect state at different levels of nested subgraphs, including resuming from breakpoints and modifying state.

#### Resuming from Breakpoints

```typescript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

// Create parent and subgraph with checkpointer
const parentGraph = new StateGraph(ParentState)
  .addNode("subgraph_node", callSubgraph)
  .addEdge(START, "subgraph_node")
  .addEdge("subgraph_node", END)
  .compile({ checkpointer });

// Stream with subgraph visibility
const config = { configurable: { thread_id: "1" } };
const stream = parentGraph.stream(
  { user_input: "test input" },
  { ...config, subgraphs: true }
);

for await (const chunk of stream) {
  console.log(chunk);
}

// Get state history including subgraph states
const stateHistory = parentGraph.getStateHistory(config);
for await (const state of stateHistory) {
  console.log("State:", state.values);
  console.log("Next:", state.next);
  console.log("Tasks:", state.tasks);
}

// Resume from specific subgraph node
const resumeConfig = {
  ...config,
  configurable: {
    ...config.configurable,
    checkpoint_ns: "subgraph_node:subgraph",
    checkpoint_id: "specific_checkpoint_id"
  }
};

const resumedResult = await parentGraph.invoke(null, resumeConfig);
```

#### Modifying Subgraph State

```typescript
// Update state of a subgraph
await parentGraph.updateState(
  {
    configurable: {
      thread_id: "1",
      checkpoint_ns: "subgraph_node:subgraph"
    }
  },
  { processed_data: "updated value" },
  "process" // Update as if coming from this subgraph node
);

// Acting as a subgraph node
await parentGraph.updateState(
  config,
  { final_response: "direct update" },
  "subgraph_node"
);

// Acting as the entire subgraph
await parentGraph.updateState(
  {
    configurable: {
      thread_id: "1",
      checkpoint_ns: "subgraph_node:subgraph"
    }
  },
  { processed_data: "subgraph update" }
);
```

### How to Transform Inputs and Outputs of Subgraphs

When you need to transform data between parent and child graphs with different state schemas:

#### Input/Output Transformation

```typescript
// Parent state
const ParentState = Annotation.Root({
  user_request: Annotation<string>,
  final_answer: Annotation<string>
});

// Child state (different schema)
const ChildState = Annotation.Root({
  query: Annotation<string>,
  response: Annotation<string>
});

// Child graph
function processQuery(state: typeof ChildState.State) {
  return {
    response: `Processed query: ${state.query}`
  };
}

const childGraph = new StateGraph(ChildState)
  .addNode("process", processQuery)
  .addEdge(START, "process")
  .addEdge("process", END)
  .compile();

// Parent node with input/output transformation
async function transformAndCall(state: typeof ParentState.State) {
  // Transform parent state to child state format
  const childInput = {
    query: state.user_request.toUpperCase() // Transform input
  };

  // Call child graph
  const childResult = await childGraph.invoke(childInput);

  // Transform child result back to parent state format
  return {
    final_answer: `Final: ${childResult.response}` // Transform output
  };
}

const parentGraph = new StateGraph(ParentState)
  .addNode("transform_call", transformAndCall)
  .addEdge(START, "transform_call")
  .addEdge("transform_call", END)
  .compile();
```

#### Complex State Mapping

```typescript
// Advanced transformation with multiple fields
async function complexTransform(state: typeof ParentState.State) {
  // Extract and transform multiple fields
  const transformedInput = {
    query: extractQuery(state.user_request),
    context: extractContext(state.user_request),
    metadata: {
      timestamp: Date.now(),
      source: "parent_graph"
    }
  };

  const result = await childGraph.invoke(transformedInput);

  // Combine results with existing state
  return {
    final_answer: combineResults(state.final_answer, result.response),
    metadata: result.metadata
  };
}

function extractQuery(request: string): string {
  // Custom extraction logic
  return request.split("?")[0];
}

function extractContext(request: string): string {
  // Custom context extraction
  return request.split("context:")[1] || "";
}

function combineResults(existing: string, newResult: string): string {
  return existing ? `${existing}\n${newResult}` : newResult;
}
```

## Node Retries and Caching

### How to Add Node Retries

Node retries allow you to automatically retry failed nodes with configurable policies, improving the reliability of your graph execution.

#### Basic Retry Configuration

```typescript
import { StateGraph, Annotation, START, END, RetryPolicy } from "@langchain/langgraph";

const State = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>
});

function callModel(state: typeof State.State) {
  // Your model calling logic here
  return { output: `Processed: ${state.input}` };
}

// Basic retry policy
const retryPolicy: RetryPolicy = {};

// Create graph with retry policy
const graph = new StateGraph(State)
  .addNode("call_model", callModel, { retryPolicy })
  .addEdge(START, "call_model")
  .addEdge("call_model", END)
  .compile();
```

#### Advanced Retry Policies

```typescript
// Custom retry policy with maxAttempts
const advancedRetryPolicy: RetryPolicy = {
  maxAttempts: 5,
  retryOn: (e: any): boolean => {
    // Custom retry logic
    return e.message.includes("rate limit") || e.message.includes("timeout");
  }
};

const advancedGraph = new StateGraph(State)
  .addNode("call_model", callModel, { retryPolicy: advancedRetryPolicy })
  .addEdge(START, "call_model")
  .addEdge("call_model", END)
  .compile();
```

#### Retry Policy Examples

```typescript
// Example with different retry conditions
const conditionalRetryPolicy: RetryPolicy = {
  retryOn: (e: any): boolean => {
    // Don't retry on authentication errors
    if (e.message.includes("unauthorized")) return false;
    // Retry on temporary failures
    if (e.message.includes("temporary")) return true;
    return false;
  }
};

const conditionalGraph = new StateGraph(State)
  .addNode("conditional_node", callModel, { retryPolicy: conditionalRetryPolicy })
  .addEdge(START, "conditional_node")
  .addEdge("conditional_node", END)
  .compile();
```

### How to Cache Expensive Nodes

Node caching helps avoid repeating expensive operations by storing and reusing results based on input parameters.

#### Basic Node Caching

```typescript
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { InMemoryCache } from "@langchain/langgraph-checkpoint";
import { BaseMessage, AIMessage } from "@langchain/core/messages";

async function expensiveOperation(state: typeof MessagesAnnotation.State) {
  // Simulate an expensive operation
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return { messages: [{ type: "ai", content: "Hello, how are you?" }] };
}

// Create cache instance
const cache = new InMemoryCache();

// Create graph with caching
const cachedGraph = new StateGraph(MessagesAnnotation)
  .addNode("expensive", expensiveOperation, {
    cachePolicy: { ttl: 120 } // Cache for 2 minutes
  })
  .addEdge(START, "expensive")
  .addEdge("expensive", END)
  .compile({ cache });
```

#### Advanced Caching with Custom Keys

```typescript
const advancedCachedGraph = new StateGraph(MessagesAnnotation)
  .addNode("cached_operation", expensiveOperation, {
    cachePolicy: { 
      ttl: 300, // 5 minutes
      keyFunc([{messages}]: [{messages: BaseMessage[]}]) {
        // Cache based on the content and relative position of the messages
        return JSON.stringify(messages.map((m, idx) => [idx, m.content]));
      }
    }
  })
  .addEdge(START, "cached_operation")
  .addEdge("cached_operation", END)
  .compile({ cache });
```

#### Cache Management

```typescript
// Example of using cache with different TTL values
const shortCacheGraph = new StateGraph(MessagesAnnotation)
  .addNode("short_cache", expensiveOperation, {
    cachePolicy: { ttl: 30 } // 30 seconds
  })
  .addEdge(START, "short_cache")
  .addEdge("short_cache", END)
  .compile({ cache });

const longCacheGraph = new StateGraph(MessagesAnnotation)
  .addNode("long_cache", expensiveOperation, {
    cachePolicy: { ttl: 3600 } // 1 hour
  })
  .addEdge(START, "long_cache")
  .addEdge("long_cache", END)
  .compile({ cache });
```

## Runtime Configuration

### How to Add Runtime Configuration to Your Graph

Runtime configuration allows you to dynamically modify graph behavior without changing the code, enabling flexible deployment across different environments and use cases.

#### Basic Runtime Configuration

```typescript
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";

const ConfigState = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>
});

// Node that uses runtime configuration
function configurableNode(state: typeof ConfigState.State, config?: RunnableConfig) {
  const modelName = config?.configurable?.model || "default-model";
  const temperature = config?.configurable?.temperature || 0.5;
  
  // Use configuration in your logic
  const result = `Processed with ${modelName} (temp: ${temperature})`;
  
  return { output: result };
}

// Create graph
const configurableGraph = new StateGraph(ConfigState)
  .addNode("process", configurableNode)
  .addEdge(START, "process")
  .addEdge("process", END)
  .compile();

// Run with specific configuration
const result = await configurableGraph.invoke(
  { input: "test input" },
  {
    configurable: {
      model: "gpt-4",
      temperature: 0.7
    }
  }
);
```

#### Environment-Specific Configuration

```typescript
// Node that adapts based on environment configuration
function environmentNode(state: typeof ConfigState.State, config?: RunnableConfig) {
  const environment = config?.configurable?.environment || "development";
  const user = config?.configurable?.user || "anonymous";
  
  let modelConfig;
  switch (environment) {
    case "production":
      modelConfig = { model: "gpt-4", temperature: 0.3 };
      break;
    case "staging":
      modelConfig = { model: "gpt-3.5-turbo", temperature: 0.5 };
      break;
    default:
      modelConfig = { model: "gpt-3.5-turbo", temperature: 0.8 };
  }
  
  return {
    output: `Environment: ${environment}, User: ${user}, Model: ${modelConfig.model}`
  };
}

const environmentGraph = new StateGraph(ConfigState)
  .addNode("env_process", environmentNode)
  .addEdge(START, "env_process")
  .addEdge("env_process", END)
  .compile();

// Run with environment configuration
const envResult = await environmentGraph.invoke(
  { input: "test" },
  {
    configurable: {
      environment: "production",
      user: "john_doe"
    }
  }
);
```

#### Feature Flags and A/B Testing

```typescript
// Node with feature flag logic using runtime configuration
function featureFlagNode(state: typeof ConfigState.State, config?: RunnableConfig) {
  const useNewAlgorithm = config?.configurable?.use_new_algorithm || false;
  const enableExperimental = config?.configurable?.experimental_feature || false;
  
  let result = state.input;
  
  if (useNewAlgorithm) {
    result = `New algorithm: ${result}`;
  } else {
    result = `Legacy algorithm: ${result}`;
  }
  
  if (enableExperimental) {
    result += " [EXPERIMENTAL]";
  }
  
  return { output: result };
}

const featureFlagGraph = new StateGraph(ConfigState)
  .addNode("feature_process", featureFlagNode)
  .addEdge(START, "feature_process")
  .addEdge("feature_process", END)
  .compile();

// Run with feature flags
const flagResult = await featureFlagGraph.invoke(
  { input: "test input" },
  {
    configurable: {
      use_new_algorithm: true,
      experimental_feature: false
    }
  }
);
```

## Structured Output

### How to Have Agent Respond in Structured Format

Structured output ensures that your agent responses follow a specific format, making them easier to parse and integrate with other systems.

#### Basic Structured Response

```typescript
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import * as v from "valibot";
import { toJsonSchema } from "../../utils/jsonSchema";
import { ChatAnthropic } from "@langchain/anthropic";

// Define response schema using valibot
const responseSchema = v.object({
  temperature: v.pipe(v.number(), v.description("the temperature")),
  other_notes: v.pipe(v.string(), v.description("any other notes about the weather"))
});

// Convert to JSON Schema for LangChain compatibility
const toolSchema = toJsonSchema(responseSchema);

// Initialize model
const model = new ChatAnthropic({ model: "claude-3-sonnet-20240229" });

// Create a final response tool
const finalResponseTool = tool(
  async (input) => {
    return input;
  },
  {
    name: "Response",
    description: "The final response",
    schema: toolSchema
  }
);

const StructuredState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y)
  })
});

// Node that calls model with structured output
async function callModel(state: typeof StructuredState.State) {
  // Bind the final response tool to the model
  const modelWithTools = model.bindTools([finalResponseTool]);

  const response = await modelWithTools.invoke(state.messages);
  return { messages: [response] };
}

// Router to check if we should continue or finish
function shouldContinue(state: typeof StructuredState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  // Check if the last message contains tool calls
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    // Check if any tool call is the final response tool
    const hasFinalResponse = lastMessage.tool_calls.some(
      (toolCall: any) => toolCall.name === "Response"
    );
    
    if (hasFinalResponse) {
      return "final";
    }
  }
  
  return "continue";
}

const structuredGraph = new StateGraph(StructuredState)
  .addNode("agent", callModel)
  .addNode("final", (state) => state)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, {
    continue: "agent",
    final: "final"
  })
  .addEdge("final", END)
  .compile();
```

#### Response Formatting and Validation

```typescript
// Enhanced response schema with validation using valibot
const detailedResponseSchema = v.object({
  answer: v.pipe(v.string(), v.minLength(1, "Answer cannot be empty")),
  confidence: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
  category: v.picklist(["factual", "opinion", "analysis"]),
  sources: v.pipe(v.array(v.string()), v.minLength(1, "At least one source required"))
});

// Convert to JSON Schema for LangChain compatibility
const detailedToolSchema = toJsonSchema(detailedResponseSchema);

// Create detailed response tool
const detailedResponseTool = tool(
  async (input) => {
    // Validate the input matches our schema
    const validated = v.parse(detailedResponseSchema, input);
    return validated;
  },
  {
    name: "DetailedResponse",
    description: "Provide a detailed structured response",
    schema: detailedToolSchema
  }
);

// Node that uses the detailed response tool
async function detailedResponseNode(state: typeof StructuredState.State) {
  const modelWithDetailedTool = model.bindTools([detailedResponseTool]);
  const response = await modelWithDetailedTool.invoke(state.messages);
  return { messages: [response] };
}

const detailedGraph = new StateGraph(StructuredState)
  .addNode("detailed_agent", detailedResponseNode)
  .addEdge(START, "detailed_agent")
  .addEdge("detailed_agent", END)
  .compile();
```

#### Multiple Response Formats

```typescript
// Multiple response format schemas using valibot
const textResponseSchema = v.object({
  format: v.literal("text"),
  content: v.string()
});

const jsonResponseSchema = v.object({
  format: v.literal("json"),
  data: v.record(v.string(), v.any())
});

// Convert to JSON Schema for LangChain compatibility
const textToolSchema = toJsonSchema(textResponseSchema);
const jsonToolSchema = toJsonSchema(jsonResponseSchema);

// Create tools for different formats
const textResponseTool = tool(
  async (input) => input,
  {
    name: "TextResponse",
    description: "Respond in text format",
    schema: textToolSchema
  }
);

const jsonResponseTool = tool(
  async (input) => input,
  {
    name: "JsonResponse",
    description: "Respond in JSON format",
    schema: jsonToolSchema
  }
);

// Node that can use multiple response formats
async function multiFormatNode(state: typeof StructuredState.State) {
  const modelWithMultipleTools = model.bindTools([
    textResponseTool,
    jsonResponseTool
  ]);

  const response = await modelWithMultipleTools.invoke(state.messages);
  return { messages: [response] };
}

const multiFormatGraph = new StateGraph(StructuredState)
  .addNode("multi_format_agent", multiFormatNode)
  .addEdge(START, "multi_format_agent")
  .addEdge("multi_format_agent", END)
  .compile();
```

## Additional Advanced Features

### How to Defer Node Execution

Deferred node execution allows you to delay the execution of a node until all other pending tasks are completed. This is particularly useful in workflows with branches of different lengths, such as map-reduce flows.

#### Basic Deferred Execution

```typescript
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  aggregate: Annotation<string[]>({
    default: () => [],
    reducer: (acc, value) => [...acc, ...value]
  })
});

const graph = new StateGraph(StateAnnotation)
  .addNode("a", (state) => {
    console.log(`Adding "A" to ${state.aggregate.join(", ")}`);
    return { aggregate: ["A"] };
  })
  .addNode("b", (state) => {
    console.log(`Adding "B" to ${state.aggregate.join(", ")}`);
    return { aggregate: ["B"] };
  })
  .addNode("b_2", (state) => {
    console.log(`Adding "B_2" to ${state.aggregate.join(", ")}`);
    return { aggregate: ["B_2"] };
  }, { defer: true })
  .addNode("c", (state) => {
    console.log(`Adding "C" to ${state.aggregate.join(", ")}`);
    return { aggregate: ["C"] };
  })
  .addNode("d", (state) => {
    console.log(`Adding "D" to ${state.aggregate.join(", ")}`);
    return { aggregate: ["D"] };
  })
  .addEdge(START, "a")
  .addEdge("a", "b")
  .addEdge("a", "c")
  .addEdge("b", "b_2")
  .addEdge(["b_2", "c"], "d")
  .addEdge("d", END)
  .compile();
```

#### Advanced Deferred Execution

```typescript
// Example with multiple deferred nodes
const AdvancedStateAnnotation = Annotation.Root({
  aggregate: Annotation<string[]>({
    default: () => [],
    reducer: (acc, value) => [...acc, ...value]
  }),
  input: Annotation<string>
});

const advancedDeferredGraph = new StateGraph(AdvancedStateAnnotation)
  .addNode("start_node", (state) => {
    return { aggregate: ["START"] };
  })
  .addNode("parallel_1", (state) => {
    return { aggregate: ["P1"] };
  })
  .addNode("parallel_2", (state) => {
    return { aggregate: ["P2"] };
  }, { defer: true })
  .addNode("parallel_3", (state) => {
    return { aggregate: ["P3"] };
  })
  .addNode("end_node", (state) => {
    return { aggregate: ["END"] };
  })
  .addEdge(START, "start_node")
  .addEdge("start_node", "parallel_1")
  .addEdge("start_node", "parallel_2")
  .addEdge("start_node", "parallel_3")
  .addEdge(["parallel_1", "parallel_2", "parallel_3"], "end_node")
  .addEdge("end_node", END)
  .compile();
```

#### Deferred Execution with Dependencies

```typescript
// Example showing deferred execution with complex dependencies
const DependencyStateAnnotation = Annotation.Root({
  aggregate: Annotation<string[]>({
    default: () => [],
    reducer: (acc, value) => [...acc, ...value]
  }),
  ready: Annotation<boolean>
});

const dependencyGraph = new StateGraph(DependencyStateAnnotation)
  .addNode("setup", (state) => {
    return { 
      aggregate: ["SETUP"],
      ready: true
    };
  })
  .addNode("worker_1", (state) => {
    return { aggregate: ["WORKER_1"] };
  })
  .addNode("worker_2", (state) => {
    return { aggregate: ["WORKER_2"] };
  }, { defer: true })
  .addNode("worker_3", (state) => {
    return { aggregate: ["WORKER_3"] };
  }, { defer: true })
  .addNode("cleanup", (state) => {
    return { aggregate: ["CLEANUP"] };
  })
  .addEdge(START, "setup")
  .addEdge("setup", "worker_1")
  .addEdge("setup", "worker_2")
  .addEdge("setup", "worker_3")
  .addEdge(["worker_1", "worker_2", "worker_3"], "cleanup")
  .addEdge("cleanup", END)
  .compile();
```

### How to Let Agent Return Tool Results Directly

This pattern allows agents to return tool results directly as the final answer, bypassing additional processing when the tool output is sufficient.

#### Basic Direct Return

```typescript
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { DynamicStructuredTool } from "@langchain/core/tools";
import * as v from "valibot";
import { toJsonSchema } from "../../utils/jsonSchema";
import { ChatAnthropic } from "@langchain/anthropic";

// Initialize model
const model = new ChatAnthropic({ model: "claude-3-sonnet-20240229" });

// Tool schema with return_direct field using valibot
const weatherToolSchema = v.object({
  location: v.pipe(v.string(), v.description("The location to get weather for")),
  return_direct: v.optional(v.pipe(v.boolean(), v.description("Whether to return the result directly")))
});

const directReturnTool = new DynamicStructuredTool({
  name: "get_weather",
  description: "Get weather information",
  schema: toJsonSchema(weatherToolSchema),
  func: async ({ location, return_direct }) => {
    const weather = `Weather in ${location}: Sunny, 72°F`;
    return weather;
  }
});

const DirectReturnState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y)
  })
});

// Node that calls model with tools
async function callModel(state: typeof DirectReturnState.State) {
  const modelWithTools = model.bindTools([directReturnTool]);
  const response = await modelWithTools.invoke(state.messages);
  return { messages: [response] };
}

// Router to check for direct return
function shouldContinue(state: typeof DirectReturnState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    // Check if any tool call has return_direct set to true
    const hasDirectReturn = lastMessage.tool_calls.some(
      (toolCall: any) => toolCall.args?.return_direct === true
    );
    
    if (hasDirectReturn) {
      return "tools";
    }
  }
  
  return "final";
}

// Tool execution node
async function callTools(state: typeof DirectReturnState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolMessages = [];

  for (const toolCall of lastMessage.tool_calls) {
    if (toolCall.args?.return_direct) {
      // Execute tool and return result directly
      const result = await directReturnTool.invoke(toolCall.args);
      toolMessages.push({
        tool_call_id: toolCall.id,
        type: "tool",
        content: result
      });
    }
  }

  return { messages: toolMessages };
}

const directReturnGraph = new StateGraph(DirectReturnState)
  .addNode("agent", callModel)
  .addNode("tools", callTools)
  .addNode("final", (state) => state)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    final: "final"
  })
  .addEdge("tools", END)
  .addEdge("final", END)
  .compile();
```

#### Advanced Direct Return with Multiple Tools

```typescript
// Multiple tools with different return behaviors using valibot
const calculatorToolSchema = v.object({
  expression: v.string(),
  return_direct: v.optional(v.pipe(v.boolean(), v.fallback(true)))
});

const searchToolSchema = v.object({
  query: v.string(),
  return_direct: v.optional(v.pipe(v.boolean(), v.fallback(false)))
});

const calculatorTool = new DynamicStructuredTool({
  name: "calculator",
  description: "Perform calculations",
  schema: toJsonSchema(calculatorToolSchema),
  func: async ({ expression }) => {
    return `Result: ${expression} = 42`;
  }
});

const searchTool = new DynamicStructuredTool({
  name: "search",
  description: "Search for information",
  schema: toJsonSchema(searchToolSchema),
  func: async ({ query }) => {
    return `Search results for: ${query}`;
  }
});

// Enhanced tool calling node
async function enhancedCallModel(state: typeof DirectReturnState.State) {
  const modelWithTools = model.bindTools([calculatorTool, searchTool]);
  const response = await modelWithTools.invoke(state.messages);
  return { messages: [response] };
}

// Enhanced router for multiple tool types
function enhancedShouldContinue(state: typeof DirectReturnState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    // Check each tool call for direct return
    for (const toolCall of lastMessage.tool_calls) {
      if (toolCall.name === "calculator" && toolCall.args?.return_direct !== false) {
        return "direct_tools";
      }
      if (toolCall.name === "search" && toolCall.args?.return_direct === true) {
        return "direct_tools";
      }
    }
    return "tools";
  }
  
  return "final";
}

// Enhanced tool execution
async function enhancedCallTools(state: typeof DirectReturnState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolMessages = [];

  for (const toolCall of lastMessage.tool_calls) {
    let result;
    if (toolCall.name === "calculator") {
      result = await calculatorTool.invoke(toolCall.args);
    } else if (toolCall.name === "search") {
      result = await searchTool.invoke(toolCall.args);
    }

    toolMessages.push({
      tool_call_id: toolCall.id,
      type: "tool",
      content: result
    });
  }

  return { messages: toolMessages };
}

const enhancedDirectReturnGraph = new StateGraph(DirectReturnState)
  .addNode("agent", enhancedCallModel)
  .addNode("tools", enhancedCallTools)
  .addNode("direct_tools", enhancedCallTools)
  .addNode("final", (state) => state)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", enhancedShouldContinue, {
    tools: "tools",
    direct_tools: "direct_tools",
    final: "final"
  })
  .addEdge("tools", "agent")
  .addEdge("direct_tools", END)
  .addEdge("final", END)
  .compile();
```

### How to Manage Agent Steps

In this example we will build a ReAct Agent that explicitly manages intermediate steps. The previous examples just put all messages into the model, but that extra context can distract the agent and add latency to the API calls. In this example we will only include the N most recent messages in the chat history.

#### Define the nodes

```typescript
import { Annotation, START, END, StateGraph } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { ChatAnthropic } from "@langchain/anthropic";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// Initialize model and tools
const model = new ChatAnthropic({ model: "claude-3-sonnet-20240229" });
const boundModel = model.bindTools([/* your tools here */]);
const toolNode = new ToolNode([/* your tools here */]);

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

// Define the function that determines whether to continue or not
const shouldContinue = (state: typeof AgentState.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If there is no function call, then we finish
  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return END;
  }
  // Otherwise if there is, we continue
  return "tools";
};

// Here we don't pass all messages to the model but rather only pass the `N` most recent.
// Note that this is a terribly simplistic way to handle messages meant as an illustration,
// and there may be other methods you may want to look into depending on your use case.
// We also have to make sure we don't truncate the chat history to include the tool message first,
// as this would cause an API error.
const callModel = async (
  state: typeof AgentState.State,
  config?: RunnableConfig,
) => {
  let modelMessages = [];
  for (let i = state.messages.length - 1; i >= 0; i--) {
    modelMessages.push(state.messages[i]);
    if (modelMessages.length >= 5) {
      if (!ToolMessage.isInstance(modelMessages[modelMessages.length - 1])) {
        break;
      }
    }
  }
  modelMessages.reverse();
  const response = await boundModel.invoke(modelMessages, config);
  // We return an object, because this will get added to the existing list
  return { messages: [response] };
};
```

#### Define the graph

```typescript
// Define a new graph
const workflow = new StateGraph(AgentState)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges(
    "agent",
    shouldContinue,
    {
      tools: "tools",
      [END]: END
    }
  )
  .addEdge("tools", "agent");

// Finally, we compile it!
// This compiles it into a LangChain Runnable,
// meaning you can use it as you would any other runnable
const app = workflow.compile();
```

## Related Links

### Subgraphs
- [How to add and use subgraphs](https://langchain-ai.github.io/langgraphjs/how-tos/subgraph/)
- [How to view and update state in subgraphs](https://langchain-ai.github.io/langgraphjs/how-tos/subgraphs-manage-state/)
- [How to transform inputs and outputs of a subgraph](https://langchain-ai.github.io/langgraphjs/how-tos/subgraph-transform-state/)

### Node Retries and Caching
- [How to add node retries](https://langchain-ai.github.io/langgraphjs/how-tos/node-retry-policies/)
- [How to cache expensive nodes](https://langchain-ai.github.io/langgraphjs/how-tos/node-caching/)

### Runtime Configuration
- [How to add runtime configuration to your graph](https://langchain-ai.github.io/langgraphjs/how-tos/configuration/)

### Structured Output
- [How to have an agent respond in structured format](https://langchain-ai.github.io/langgraphjs/how-tos/respond-in-format/)

### Additional Advanced Features
- [How to defer node execution](https://langchain-ai.github.io/langgraphjs/how-tos/defer-node-execution/)
- [How to let an agent return tool results directly](https://langchain-ai.github.io/langgraphjs/how-tos/dynamically-returning-directly/)
- [How to manage agent steps](https://langchain-ai.github.io/langgraphjs/how-tos/managing-agent-steps/)
