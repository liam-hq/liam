# Streaming

LangGraph supports multiple streaming modes. The main ones are:
- `values`: This streaming mode streams back values of the graph. This is the full state of the graph after each node is called.
- `updates`: This streaming mode streams back updates to the graph. This is the update to the state of the graph after each node is called.

## Stream Modes

### How to stream the full state of your graph

This streaming mode streams back values of the graph. This is the full state of the graph after each node is called.

```typescript
import { Annotation, START } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});
```

This guide covers `streamMode="values"`.

```typescript
// process.env.OPENAI_API_KEY = "sk-...";
```

```typescript
import { END, START, StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import * as v from "valibot";
import { tool } from "@langchain/core/tools";
import { toJsonSchema } from "@valibot/to-json-schema";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const getWeather = tool(
  async ({ city }) => {
    if (city === "nyc") {
      return "It might be cloudy in nyc";
    } else if (city === "sf") {
      return "It's always sunny in sf";
    } else {
      throw new Error("Unknown city.");
    }
  },
  {
    name: "get_weather",
    description: "Use this to get weather information",
    schema: toJsonSchema(v.object({
      city: v.picklist(["nyc", "sf"]),
    })),
  }
);

const tools = [getWeather];
const toolNode = new ToolNode(tools);

const model = new ChatOpenAI({ model: "gpt-4o" }).bindTools(tools);

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return END;
};

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const response = await model.invoke(messages);
  return { messages: [response] };
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

const app = workflow.compile();
```

```typescript
const inputs = { messages: [new HumanMessage("what is the weather in sf")] };
for await (const output of await app.stream(inputs, {
  streamMode: "values",
})) {
  console.log("Full state:", output);
}
```

### How to stream state updates of your graph

This streaming mode streams back updates to the graph. This is the update to the state of the graph after each node is called.

```typescript
const inputs = { messages: [new HumanMessage("what is the weather in sf")] };
for await (const output of await app.stream(inputs, {
  streamMode: "updates",
})) {
  console.log("Node updates:", output);
}
```

### How to configure multiple streaming modes

LangGraph supports configuring multiple streaming modes at the same time.

```typescript
const inputs = { messages: [new HumanMessage("what is the weather in sf")] };
for await (const output of await app.stream(inputs, {
  streamMode: ["values", "updates"],
})) {
  console.log("Combined stream:", output);
}
```

## Token-level Streaming

### How to stream LLM tokens

In this example, we will stream tokens from the language model powering an agent. We will use a ReAct agent as an example.

```typescript
import { END, START, StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import * as v from "valibot";
import { tool } from "@langchain/core/tools";
import { toJsonSchema } from "@valibot/to-json-schema";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const getWeather = tool(
  async ({ city }) => {
    if (city === "nyc") {
      return "It might be cloudy in nyc";
    } else if (city === "sf") {
      return "It's always sunny in sf";
    } else {
      throw new Error("Unknown city.");
    }
  },
  {
    name: "get_weather",
    description: "Use this to get weather information",
    schema: toJsonSchema(v.object({
      city: v.picklist(["nyc", "sf"]),
    })),
  }
);

const tools = [getWeather];
const toolNode = new ToolNode(tools);

const model = new ChatOpenAI({ model: "gpt-4o-mini" }).bindTools(tools);

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return END;
};

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const response = await model.invoke(messages);
  return { messages: [response] };
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

const app = workflow.compile();
```

```typescript
const inputs = { messages: [new HumanMessage("what is the weather in sf")] };
const eventStream = await app.streamEvents(inputs, { version: "v2" });

for await (const { event, data } of eventStream) {
  if (event === "on_chat_model_stream") {
    console.log(data.chunk.content);
  }
}
```

## Custom Data Streaming

### How to stream custom data

The most common use case for streaming from inside a node is to stream LLM tokens, but you may also want to stream custom data.

For example, if you have a long-running tool call, you can dispatch custom events between the steps and use these custom events to monitor progress. You could also surface these custom events to an end user of your application to show them how the current task is progressing.

You can do so in two ways:

- using your graph's `.stream` method with `streamMode: "custom"`
- emitting custom events using `dispatchCustomEvent` with `streamEvents`.

Below we'll see how to use both APIs.

```typescript
import { END, StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch";
import type { RunnableConfig } from "@langchain/core/runnables";
import { HumanMessage } from "@langchain/core/messages";

const myNode = async (
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig
) => {
  console.log("--- Node 1 ---");
  return { messages: state.messages };
};

const myOtherNode = async (
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig
) => {
  console.log("--- Node 2 ---");
  
  // Use the config.writer to write custom data to the stream
  config.writer?.({
    myCustomData: "some_value",
    moreCustomData: "some_other_value",
  });
  
  return { messages: state.messages };
};

const graph = new StateGraph(MessagesAnnotation)
  .addNode("myNode", myNode)
  .addNode("myOtherNode", myOtherNode)
  .addEdge(START, "myNode")
  .addEdge("myNode", "myOtherNode")
  .addEdge("myOtherNode", END)
  .compile();
```

```typescript
const inputs = { messages: [new HumanMessage("hello world")] };

for await (const chunk of await graph.stream(inputs, {
  streamMode: "custom",
})) {
  console.log(chunk);
}
```

```typescript
const myNodeWithEvents = async (
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig
) => {
  console.log("--- Node 1 ---");
  
  await dispatchCustomEvent("my_custom_event", {
    message: "hello from node 1",
  }, config);
  
  return { messages: state.messages };
};

const myOtherNodeWithEvents = async (
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig
) => {
  console.log("--- Node 2 ---");
  
  await dispatchCustomEvent("my_custom_event", {
    message: "hello from node 2",
  }, config);
  
  return { messages: state.messages };
};

const graphWithEvents = new StateGraph(MessagesAnnotation)
  .addNode("myNode", myNodeWithEvents)
  .addNode("myOtherNode", myOtherNodeWithEvents)
  .addEdge(START, "myNode")
  .addEdge("myNode", "myOtherNode")
  .addEdge("myOtherNode", END)
  .compile();
```

```typescript
const inputs = { messages: [new HumanMessage("hello world")] };
const eventStream = await graphWithEvents.streamEvents(inputs, { version: "v2" });

for await (const { event, data } of eventStream) {
  if (event === "on_custom_event") {
    console.log(data);
  }
}
```

## Streaming from Tools and Nodes

### How to stream events from within a tool

If your LangGraph graph needs to use tools that call LLMs (or any other LangChain Runnable objects - other graphs, LCEL chains, retrievers, etc.), you might want to stream events from the underlying Runnable. This guide shows how you can do that.

```typescript
import * as v from "valibot";
import { tool } from "@langchain/core/tools";
import { toJsonSchema } from "@valibot/to-json-schema";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const getItems = tool(
  async (input, config) => {
    const template = ChatPromptTemplate.fromMessages([
      ["human", "{input}"]
    ]);
    
    const model = new ChatAnthropic({
      model: "claude-3-5-sonnet-20240620",
      temperature: 0,
    });

    const chain = template.pipe(model);
    
    const response = await chain.invoke(
      { input: input.input },
      { ...config, tags: ["my_tool"] }
    );
    
    return response.content;
  },
  {
    name: "get_items",
    description: "Get items from the database",
    schema: toJsonSchema(v.object({
      input: v.string(),
    })),
  }
);

const tools = [getItems];

const model = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
  temperature: 0,
});

const graph = createReactAgent({ llm: model, tools });
```

```typescript
import { HumanMessage } from "@langchain/core/messages";

const inputs = { messages: [new HumanMessage("get some items")] };
const eventStream = await graph.streamEvents(inputs, { 
  version: "v2",
  includeTags: ["my_tool"]
});

for await (const { event, data } of eventStream) {
  if (event === "on_chat_model_stream") {
    console.log(data.chunk.content);
  }
}
```

### How to stream from the final node

One common pattern for graphs is to stream LLM tokens from inside the final node only. This guide demonstrates how you can do this.

```typescript
import * as v from "valibot";
import { tool } from "@langchain/core/tools";
import { toJsonSchema } from "@valibot/to-json-schema";
import { ChatAnthropic } from "@langchain/anthropic";

const getWeather = tool(async ({ city }) => {
  if (city === "nyc") {
    return "It might be cloudy in nyc";
  } else if (city === "sf") {
    return "It's always sunny in sf";
  } else {
    throw new Error("Unknown city.");
  }
}, {
  name: "get_weather",
  schema: toJsonSchema(v.object({
    city: v.picklist(["nyc", "sf"]),
  })),
  description: "Use this to get weather information",
});

const tools = [getWeather];

const model = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
}).bindTools(tools);

const finalModel = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
}).withConfig({
  tags: ["final_node"],
});
```

```typescript
import { END, StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

const shouldContinue = async (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastMessage: AIMessage = messages[messages.length - 1];
  
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return "final";
};

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const response = await model.invoke(messages);
  return { messages: [response] };
};

const callFinalModel = async (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastAIMessage = messages[messages.length - 1];
  
  const response = await finalModel.invoke([
    new SystemMessage("Rewrite this in the voice of Al Roker"),
    new HumanMessage({ content: lastAIMessage.content })
  ]);
  
  response.id = lastAIMessage.id;
  return { messages: [response] };
};

const toolNode = new ToolNode<typeof MessagesAnnotation.State>(tools);

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addNode("final", callFinalModel)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    final: "final",
  })
  .addEdge("tools", "agent")
  .addEdge("final", END)
  .compile();
```

```typescript
const inputs = { messages: [new HumanMessage("What's the weather in nyc?")] };
const eventStream = await graph.streamEvents(inputs, { version: "v2" });

for await (const { event, tags, data } of eventStream) {
  if (event === "on_chat_model_stream" && tags.includes("final_node")) {
    if (data.chunk.content) {
      console.log(data.chunk.content, "|");
    }
  }
}
```

## Related Links

For more detailed information, refer to the official LangGraph.js documentation:

### Stream Modes
- [How to stream the full state of your graph](https://langchain-ai.github.io/langgraphjs/how-tos/stream-values/)
- [How to stream state updates of your graph](https://langchain-ai.github.io/langgraphjs/how-tos/stream-updates/)
- [How to configure multiple streaming modes](https://langchain-ai.github.io/langgraphjs/how-tos/stream-multiple/)

### Token-level Streaming
- [How to stream LLM tokens](https://langchain-ai.github.io/langgraphjs/how-tos/stream-tokens/)

### Custom Data Streaming
- [How to stream custom data](https://langchain-ai.github.io/langgraphjs/how-tos/streaming-content/)

### Streaming from Tools and Nodes
- [How to stream events from within a tool](https://langchain-ai.github.io/langgraphjs/how-tos/streaming-events-from-within-tools/)
- [How to stream from the final node](https://langchain-ai.github.io/langgraphjs/how-tos/streaming-from-final-node/)
