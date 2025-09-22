# Tool Calling

This guide covers how to use LangGraph's prebuilt ToolNode for tool calling.

ToolNode is a LangChain Runnable that takes graph state (with a list of messages) as input and outputs state update with the result of tool calls. It is designed to work well out-of-box with LangGraph's prebuilt ReAct agent, but can also work with any StateGraph as long as its state has a messages key with an appropriate reducer.

## ToolNode Usage

### How to call tools using ToolNode

This guide covers how to use LangGraph's prebuilt ToolNode for tool calling.

```typescript
import { tool } from "@langchain/core/tools";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";

const getWeather = tool((input) => {
  if (["sf", "san francisco"].includes(input.location.toLowerCase())) {
    return "It's 60 degrees and foggy.";
  } else {
    return "It's 90 degrees and sunny.";
  }
}, {
  name: "get_weather",
  description: "Call to get the current weather.",
  schema: toJsonSchema(v.object({
    location: v.pipe(v.string(), v.description("Location to get the weather for.")),
  })),
});
```

```typescript
import { END, START, StateGraph } from "@langchain/langgraph";
import { MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseMessage, isAIMessage } from "@langchain/core/messages";

const toolNode = new ToolNode([getWeather]);

const modelWithTools = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0,
}).bindTools([getWeather]);

const shouldContinue = async (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length) {
    return "tools";
  }
  return END;
};

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const response = await modelWithTools.invoke(state.messages);
  return { messages: [response] };
};

const app = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent")
  .compile();
```

### Manually call ToolNode

```typescript
import { AIMessage } from "@langchain/core/messages";

const toolResult = await toolNode.invoke({
  messages: [
    new AIMessage({
      content: "",
      tool_calls: [
        {
          name: "get_weather",
          args: { location: "sf" },
          id: "tool_call_id",
        },
      ],
    }),
  ],
});

console.log(toolResult);
```

### ReAct Agent

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const agent = createReactAgent({
  llm: modelWithTools,
  tools: [getWeather],
});

const finalState = await agent.invoke({
  messages: [{ role: "user", content: "what is the weather in sf" }],
});

console.log(finalState.messages[finalState.messages.length - 1].content);
```

## Tool Calling Patterns

### How to force an agent to call a tool

In this example we will build a ReAct agent that **always** calls a certain tool first, before making any plans. In this example, we will create an agent with a search tool. However, at the start we will force the agent to call the search tool (and then let it do whatever it wants after). This is useful when you know you want to execute specific actions in your application but also want the flexibility of letting the LLM follow up on the user's query after going through that fixed sequence.

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";

const searchTool = new DynamicStructuredTool({
  name: "search",
  description:
    "Use to surf the web, fetch current information, check the weather, and retrieve other information.",
  schema: toJsonSchema(v.object({
    query: v.pipe(v.string(), v.description("The query to use in your search.")),
  })),
  func: async ({ }: { query: string }) => {
    // This is a placeholder for the actual implementation
    return "Cold, with a low of 13 ℃";
  },
});

const tools = [searchTool];
```

```typescript
import { ToolNode } from "@langchain/langgraph/prebuilt";

const toolNode = new ToolNode(tools);
```

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  temperature: 0,
  model: "gpt-4o",
});

const boundModel = model.bindTools(tools);
```

```typescript
import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});
```

```typescript
import { AIMessage, AIMessageChunk } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { concat } from "@langchain/core/utils/stream";

// Define logic that will be used to determine which conditional edge to go down
const shouldContinue = (state: typeof AgentState.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If there is no function call, then we finish
  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return "end";
  }
  // Otherwise if there is, we continue
  return "continue";
};

// Define the function that calls the model
const callModel = async (
  state: typeof AgentState.State,
  config?: RunnableConfig,
) => {
  const { messages } = state;
  let response: AIMessageChunk | undefined;
  for await (const message of await boundModel.stream(messages, config)) {
    if (!response) {
      response = message;
    } else {
      response = concat(response, message);
    }
  }
  // We return an object, because this will get added to the existing list
  return {
    messages: response ? [response as AIMessage] : [],
  };
};

// This is the new first - the first call of the model we want to explicitly hard-code some action
const firstModel = async (state: typeof AgentState.State) => {
  const humanInput = state.messages[state.messages.length - 1].content || "";
  return {
    messages: [
      new AIMessage({
        content: "",
        tool_calls: [
          {
            name: "search",
            args: {
              query: humanInput,
            },
            id: "tool_abcd123",
          },
        ],
      }),
    ],
  };
};
```

```typescript
import { END, START, StateGraph } from "@langchain/langgraph";

// Define a new graph
const workflow = new StateGraph(AgentState)
  // Define the new entrypoint
  .addNode("first_agent", firstModel)
  // Define the two nodes we will cycle between
  .addNode("agent", callModel)
  .addNode("action", toolNode)
  // Set the entrypoint as `first_agent`
  // by creating an edge from the virtual __start__ node to `first_agent`
  .addEdge(START, "first_agent")
  // We now add a conditional edge
  .addConditionalEdges(
    // First, we define the start node. We use `agent`.
    // This means these are the edges taken after the `agent` node is called.
    "agent",
    // Next, we pass in the function that will determine which node is called next.
    shouldContinue,
    // Finally we pass in a mapping.
    // The keys are strings, and the values are other nodes.
    // END is a special node marking that the graph should finish.
    // What will happen is we will call `should_continue`, and then the output of that
    // will be matched against the keys in this mapping.
    // Based on which one it matches, that node will then be called.
    {
      // If `tools`, then we call the tool node.
      continue: "action",
      // Otherwise we finish.
      end: END,
    },
  )
  // We now add a normal edge from `tools` to `agent`.
  // This means that after `tools` is called, `agent` node is called next.
  .addEdge("action", "agent")
  // After we call the first agent, we know we want to go to action
  .addEdge("first_agent", "action");

// Finally, we compile it!
// This compiles it into a LangChain Runnable,
// meaning you can use it as you would any other runnable
const app = workflow.compile();
```

### How to handle tool calling errors

LLMs aren't perfect at calling tools. The model may try to call a tool that doesn't exist or fail to return arguments that match the requested schema. Strategies like keeping schemas simple, reducing the number of tools you pass at once, and having good names and descriptions can help mitigate this risk, but aren't foolproof.

This guide covers some ways to build error handling into your graphs to mitigate these failure modes.

#### Using the prebuilt ToolNode

To start, define a mock weather tool that has some hidden restrictions on input queries. The intent here is to simulate a real-world case where a model fails to call a tool correctly:

```typescript
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";
import { tool } from "@langchain/core/tools";

const getWeather = tool(async ({ location }) => {
  if (location === "SAN FRANCISCO") {
    return "It's 60 degrees and foggy";
  } else if (location.toLowerCase() === "san francisco") {
    throw new Error("Input queries must be all capitals");
  } else {
    throw new Error("Invalid input.");
  }
}, {
  name: "get_weather",
  description: "Call to get the current weather",
  schema: toJsonSchema(v.object({
    location: v.string(),
  })),
});
```

Next, set up a graph implementation of the ReAct agent. This agent takes some query as input, then repeatedly call tools until it has enough information to resolve the query. We'll use the prebuilt ToolNode to execute called tools, and a small, fast model powered by Anthropic:

```typescript
import { END, START, StateGraph } from "@langchain/langgraph";
import { MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseMessage, isAIMessage } from "@langchain/core/messages";

const toolNode = new ToolNode([getWeather]);

const modelWithTools = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0,
}).bindTools([getWeather]);

const shouldContinue = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length) {
    return "tools";
  }
  return END;
};

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const response = await modelWithTools.invoke(messages);
  return { messages: [response] };
};

const app = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue, {
    // Explicitly list possible destinations so that
    // we can automatically draw the graph below.
    tools: "tools",
    [END]: END,
  })
  .compile();
```

When you try to call the tool, you can see that the model calls the tool with a bad input, causing the tool to throw an error. The prebuilt ToolNode that executes the tool has some built-in error handling that captures the error and passes it back to the model so that it can try again.

#### Custom strategies

This is a fine default in many cases, but there are cases where custom fallbacks may be better.

For example, the below tool requires as input a list of elements of a specific length - tricky for a small model! We'll also intentionally avoid pluralizing `topic` to trick the model into thinking it should pass a string:

```typescript
import { StringOutputParser } from "@langchain/core/output_parsers";

const haikuRequestSchema = v.pipe(
  v.object({
    topic: v.array(v.string()),
  }),
  v.check(input => input.topic.length === 3, "Topic array must have exactly 3 elements")
);

const haikuRequestJsonSchema = toJsonSchema(haikuRequestSchema);

const masterHaikuGenerator = tool(async ({ topic }) => {
  const model = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0,
  });
  const chain = model.pipe(new StringOutputParser());
  const topics = topic.join(", ");
  const haiku = await chain.invoke(`Write a haiku about ${topics}`);
  return haiku;
}, {
  name: "master_haiku_generator",
  description: "Generates a haiku based on the provided topics.",
  schema: haikuRequestJsonSchema,
});
```

A better strategy might be to trim the failed attempt to reduce distraction, then fall back to a more advanced model. Here's an example - note the custom-built tool calling node instead of the prebuilt `ToolNode`:

```typescript
import { END, START, StateGraph } from "@langchain/langgraph";
import { MessagesAnnotation } from "@langchain/langgraph";
import { AIMessage, ToolMessage, RemoveMessage } from "@langchain/core/messages";

const callTool = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const toolsByName = { master_haiku_generator: masterHaikuGenerator };
  const lastMessage = messages[messages.length - 1] as AIMessage;
  const outputMessages: ToolMessage[] = [];
  for (const toolCall of lastMessage.tool_calls) {
    try {
      const toolResult = await toolsByName[toolCall.name].invoke(toolCall);
      outputMessages.push(toolResult);
    } catch (error: any) {
      // Return the error if the tool call fails
      outputMessages.push(
        new ToolMessage({
          content: error.message,
          name: toolCall.name,
          tool_call_id: toolCall.id!,
          additional_kwargs: { error }
        })
      );
    }
  }
  return { messages: outputMessages };
};

const model = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0,
});

const modelWithTools = model.bindTools([masterHaikuGenerator]);

const betterModel = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
  temperature: 0,
});

const betterModelWithTools = betterModel.bindTools([masterHaikuGenerator]);

const shouldContinue = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length) {
    return "tools";
  }
  return END;
};

const shouldFallback = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const failedToolMessages = messages.find((message) => {
    return message._getType() === "tool" && message.additional_kwargs.error !== undefined;
  });
  if (failedToolMessages) {
    return "remove_failed_tool_call_attempt";
  }
  return "agent";
};

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const response = await modelWithTools.invoke(messages);
  return { messages: [response] };
};

const removeFailedToolCallAttempt = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  // Remove all messages from the most recent
  // instance of AIMessage onwards.
  const lastAIMessageIndex = messages
    .map((msg, index) => ({ msg, index }))
    .reverse()
    .findIndex(({ msg }) => isAIMessage(msg));
  const messagesToRemove = messages.slice(lastAIMessageIndex);
  return { messages: messagesToRemove.map(m => new RemoveMessage({ id: m.id })) };
};

const callFallbackModel = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const response = await betterModelWithTools.invoke(messages);
  return { messages: [response] };
};

const app = new StateGraph(MessagesAnnotation)
  .addNode("tools", callTool)
  .addNode("agent", callModel)
  .addNode("remove_failed_tool_call_attempt", removeFailedToolCallAttempt)
  .addNode("fallback_agent", callFallbackModel)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, {
    // Explicitly list possible destinations so that
    // we can automatically draw the graph below.
    tools: "tools",
    [END]: END,
  })
  .addConditionalEdges("tools", shouldFallback, {
    remove_failed_tool_call_attempt: "remove_failed_tool_call_attempt",
    agent: "agent",
  })
  .addEdge("remove_failed_tool_call_attempt", "fallback_agent")
  .addEdge("fallback_agent", "tools")
  .compile();
```

The `tools` node will now return `ToolMessage`s with an `error` field in `additional_kwargs` if a tool call fails. If that happens, it will go to another node that removes the failed tool messages, and has a better model retry the tool call generation. We also add a trimming step via returning the special message modifier `RemoveMessage` to remove previous messages from the state.

### How to pass runtime values to tools

This guide shows how to define tools that depend on dynamically defined variables. These values are provided by your program, not by the LLM.

Tools can access the config.configurable field for values like user IDs that are known when a graph is initially executed, as well as managed values from the store for persistence across threads.

However, it can be convenient to access intermediate runtime values which are not known ahead of time, but are progressively generated as a graph executes, such as the current graph state. This guide will cover two techniques for this: The getCurrentTaskInput utility function, and closures.

#### The getCurrentTaskInput Utility Function

The getCurrentTaskInput utility function makes it easier to get the current state in areas of your application that might be called indirectly, like tool handlers.

**Compatibility**

This functionality was added in @langchain/langgraph>=0.2.53.

It also requires async_hooks support, which is supported in many popular JavaScript environments (such as Node.js, Deno, and Cloudflare Workers), but not all of them (mainly web browsers). If you are deploying to an environment where this is not supported, see the Closures section below.

Let's start off by defining a tool that an LLM can use to update pet preferences for a user. The tool will retrieve the current state of the graph from the current context.

##### Define the agent state

Since we're just tracking messages, we'll use the MessagesAnnotation:

```typescript
import { MessagesAnnotation } from "@langchain/langgraph";
```

Now, declare a tool as shown below. The tool receives values in three different ways:

1. It will receive a generated list of pets from the LLM in its input.
2. It will pull a userId populated from the initial graph invocation.
3. It will fetch the input that was passed to the currenty executing task (either a StateGraph node handler, or a Functional API entrypoint or task) via the getCurrentTaskInput function.

It will then use LangGraph's cross-thread persistence to save preferences:

```typescript
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";
import { tool } from "@langchain/core/tools";
import {
  getCurrentTaskInput,
  LangGraphRunnableConfig,
} from "@langchain/langgraph";

const updateFavoritePets = tool(async (input, config: LangGraphRunnableConfig) => {
  // Some arguments are populated by the LLM; these are included in the schema below
  const { pets } = input;
  // Fetch the current input to the task that called this tool.
  // This will be identical to the input that was passed to the `ToolNode` that called this tool.
  const currentState = getCurrentTaskInput() as typeof MessagesAnnotation.State;
  // Other information (such as a UserID) are most easily provided via the config
  // This is set when when invoking or streaming the graph
  const userId = config.configurable?.userId;
  // LangGraph's managed key-value store is also accessible from the config
  const store = config.store;
  await store.put([userId, "pets"], "names", pets);
  // Store the initial input message from the user as a note.
  // Using the same key will override previous values - you could
  // use something different if you wanted to store many interactions.
  await store.put([userId, "pets"], "context", { content: currentState.messages[0].content });
  return "update_favorite_pets called.";
}, {
  // The LLM "sees" the following schema:
  name: "update_favorite_pets",
  description: "add to the list of favorite pets.",
  schema: toJsonSchema(v.object({
    pets: v.array(v.string()),
  })),
});
```

If we look at the tool call schema, which is what is passed to the model for tool-calling, we can see that only pets is being passed:

```typescript
// Schema inspection example (valibot schemas can be inspected directly)
console.log(updateFavoritePets.schema);
```

```typescript
{
  type: 'object',
  properties: { pets: { type: 'array', items: [Object] } },
  required: [ 'pets' ],
  additionalProperties: false,
  '$schema': 'http://json-schema.org/draft-07/schema#'
}
```

Let's also declare another tool so that our agent can retrieve previously set preferences:

```typescript
const getFavoritePets = tool(
  async (_, config: LangGraphRunnableConfig) => {
    const userId = config.configurable?.userId;
    // LangGraph's managed key-value store is also accessible via the config
    const store = config.store;
    const petNames = await store.get([userId, "pets"], "names");
    const context = await store.get([userId, "pets"], "context");
    return JSON.stringify({
      pets: petNames.value,
      context: context.value.content,
    });
  }, {
    // The LLM "sees" the following schema:
    name: "get_favorite_pets",
    description: "retrieve the list of favorite pets for the given user.",
    schema: toJsonSchema(v.object({})),
  }
);
```

##### Define the nodes

From here there's really nothing special that needs to be done. This approach works with both StateGraph and functional agents, and it works just as well with prebuilt agents like createReactAgent! We'll demonstrate it by defining a custom ReAct agent using StateGraph. This is very similar to the agent that you'd get if you were to instead call createReactAgent.

Let's start off by defining the nodes for our graph.

1. The agent: responsible for deciding what (if any) actions to take.
2. A function to invoke tools: if the agent decides to take an action, this node will then execute that action.

We will also need to define some edges.

1. After the agent is called, we should either invoke the tool node or finish.
2. After the tool node have been invoked, it should always go back to the agent to decide what to do next

```typescript
import {
  END,
  START,
  StateGraph,
  MemorySaver,
  InMemoryStore,
} from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({ model: "gpt-4o" });
const tools = [getFavoritePets, updateFavoritePets];

const routeMessage = (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If no tools are called, we can finish (respond to the user)
  if (!lastMessage?.tool_calls?.length) {
    return END;
  }
  // Otherwise if there is, we continue and call the tools
  return "tools";
};

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const modelWithTools = model.bindTools(tools);
  const responseMessage = await modelWithTools.invoke([
    {
      role: "system",
      content: "You are a personal assistant. Store any preferences the user tells you about."
    },
    ...messages
  ]);
  return { messages: [responseMessage] };
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeMessage)
  .addEdge("tools", "agent");

const memory = new MemorySaver();
const store = new InMemoryStore();
const graph = workflow.compile({ checkpointer: memory, store: store });
```

##### Use it!

Let's use our graph now!

```typescript
import {
  BaseMessage,
  isAIMessage,
  isHumanMessage,
  isToolMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";

let inputs = {
  messages: [new HumanMessage({ content: "My favorite pet is a terrier. I saw a cute one on Twitter." })],
};

let config = {
  configurable: {
    thread_id: "1",
    userId: "a-user",
  },
};

function printMessages(messages: BaseMessage[]) {
  for (const message of messages) {
    if (isHumanMessage(message)) {
      console.log(`User: ${message.content}`);
    } else if (isAIMessage(message)) {
      const aiMessage = message as AIMessage;
      if (aiMessage.content) {
        console.log(`Assistant: ${aiMessage.content}`);
      }
      if (aiMessage.tool_calls) {
        for (const toolCall of aiMessage.tool_calls) {
          console.log(`Tool call: ${toolCall.name}(${JSON.stringify(toolCall.args)})`);
        }
      }
    } else if (isToolMessage(message)) {
      const toolMessage = message as ToolMessage;
      console.log(`${toolMessage.name} tool output: ${toolMessage.content}`);
    }
  }
}

let { messages } = await graph.invoke(inputs, config);
printMessages(messages);
```

```typescript
User: My favorite pet is a terrier. I saw a cute one on Twitter.
Tool call: update_favorite_pets({"pets":["terrier"]})
update_favorite_pets tool output: update_favorite_pets called.
Assistant: I've added "terrier" to your list of favorite pets. If you have any more favorites, feel free to let me know!
```

Now verify it can properly fetch the stored preferences and cite where it got the information from:

```typescript
inputs = { messages: [new HumanMessage({ content: "What're my favorite pets and what did I say when I told you about them?" })] };

config = {
  configurable: {
    thread_id: "2", // New thread ID, so the conversation history isn't present.
    userId: "a-user"
  }
};

messages = (await graph.invoke(inputs, config)).messages;
printMessages(messages);
```

```typescript
User: What're my favorite pets and what did I say when I told you about them?
Tool call: get_favorite_pets({})
get_favorite_pets tool output: {"pets":["terrier"],"context":"My favorite pet is a terrier. I saw a cute one on Twitter."}
Assistant: Your favorite pet is a terrier. You mentioned, "My favorite pet is a terrier. I saw a cute one on Twitter."
```

As you can see the agent is able to properly cite that the information came from Twitter!

#### Closures

If you cannot use context variables in your environment, you can use closures to create tools with access to dynamic content. Here is a high-level example:

```typescript
function generateTools(state: typeof MessagesAnnotation.State) {
  const updateFavoritePets = tool(
    async (input, config: LangGraphRunnableConfig) => {
      // Some arguments are populated by the LLM; these are included in the schema below
      const { pets } = input;
      // Others (such as a UserID) are best provided via the config
      // This is set when when invoking or streaming the graph
      const userId = config.configurable?.userId;
      // LangGraph's managed key-value store is also accessible via the config
      const store = config.store;
      await store.put([userId, "pets"], "names", pets)
      await store.put([userId, "pets"], "context", { content: state.messages[0].content })
      return "update_favorite_pets called.";
    }, {
      // The LLM "sees" the following schema:
      name: "update_favorite_pets",
      description: "add to the list of favorite pets.",
      schema: toJsonSchema(v.object({
        pets: v.array(v.string()),
      })),
    }
  );
  return [updateFavoritePets];
};
```

Then, when laying out your graph, you will need to call the above method whenever you bind or invoke tools. For example:

```typescript
const toolNodeWithClosure = async (state: typeof MessagesAnnotation.State) => {
  // We fetch the tools any time this node is reached to
  // form a closure and let it access the latest messages
  const tools = generateTools(state);
  const toolNodeWithConfig = new ToolNode(tools);
  return toolNodeWithConfig.invoke(state);
};
```

## State Updates from Tools

### How to update graph state from tools

A common use case is updating graph state from inside a tool. For example, in a customer support application you might want to look up customer account number or ID in the beginning of the conversation. To update the graph state from the tool, you can return a Command object from the tool:

```typescript
import { tool } from "@langchain/core/tools";

const lookupUserInfo = tool(async (input, config) => {
  const userInfo = getUserInfo(config);
  return new Command({
    // update state keys
    update: {
      user_info: userInfo,
      messages: [
        new ToolMessage({
          content: "Successfully looked up user information",
          tool_call_id: config.toolCall.id,
        }),
      ],
    },
  });
}, {
  name: "lookup_user_info",
  description: "Use this to look up user information to better assist them with their questions.",
  schema: toJsonSchema(v.object({
    // Define your schema here
  })),
});
```

This guide shows how you can do this using LangGraph's prebuilt components (createReactAgent and ToolNode).

```typescript
import { Annotation, Command, MessagesAnnotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  // user provided
  lastName: Annotation<string>,
  // updated by the tool
  userInfo: Annotation<Record<string, any>>,
});

const USER_ID_TO_USER_INFO = {
  abc123: {
    user_id: "abc123",
    name: "Bob Dylan",
    location: "New York, NY",
  },
  zyx987: {
    user_id: "zyx987",
    name: "Taylor Swift",
    location: "Beverly Hills, CA",
  },
};

const lookupUserInfo = tool(async (_, config) => {
  const userId = config.configurable?.user_id;
  if (userId === undefined) {
    throw new Error("Please provide a user id in config.configurable");
  }
  if (USER_ID_TO_USER_INFO[userId] === undefined) {
    throw new Error(`User "${userId}" not found`);
  }
  // Populated when a tool is called with a tool call from a model as input
  const toolCallId = config.toolCall.id;
  return new Command({
    update: {
      // update the state keys
      userInfo: USER_ID_TO_USER_INFO[userId],
      // update the message history
      messages: [
        {
          role: "tool",
          content: "Successfully looked up user information",
          tool_call_id: toolCallId,
        },
      ],
    },
  });
}, {
  name: "lookup_user_info",
  description: "Always use this to look up information about the user to better assist them with their questions.",
  schema: toJsonSchema(v.object({})),
});
```

```typescript
const stateModifier = (state: typeof StateAnnotation.State) => {
  const userInfo = state.userInfo;
  if (userInfo == null) {
    return state.messages;
  }
  const systemMessage = `User name is ${userInfo.name}. User lives in ${userInfo.location}`;
  return [
    {
      role: "system",
      content: systemMessage,
    },
    ...state.messages,
  ];
};
```

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-4o",
});

const agent = createReactAgent({
  llm: model,
  tools: [lookupUserInfo],
  stateSchema: StateAnnotation,
  stateModifier: stateModifier,
});
```

## Related Links

For more detailed information, refer to the official LangGraph.js documentation:

### ToolNode Usage
- [How to call tools using ToolNode](https://langchain-ai.github.io/langgraphjs/how-tos/tool-calling/)

### Tool Calling Patterns
- [How to force an agent to call a tool](https://langchain-ai.github.io/langgraphjs/how-tos/force-calling-a-tool-first/)
- [How to handle tool calling errors](https://langchain-ai.github.io/langgraphjs/how-tos/tool-calling-errors/)
- [How to pass runtime values to tools](https://langchain-ai.github.io/langgraphjs/how-tos/pass-run-time-values-to-tools/)

### State Updates from Tools
- [How to update graph state from tools](https://langchain-ai.github.io/langgraphjs/how-tos/update-state-from-tools/)

### Additional Tool-related Features
- [How to stream events from within a tool](https://langchain-ai.github.io/langgraphjs/how-tos/streaming-events-from-within-tools/)
