#!/usr/bin/env tsx

import {
  type AIMessageChunk,
  HumanMessage,
  isAIMessageChunk,
} from '@langchain/core/messages'
import { DynamicStructuredTool } from '@langchain/core/tools'
import {
  Annotation,
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import {
  createLogger,
  getLogLevel,
  validateEnvironment,
} from './shared/scriptUtils'

const currentLogLevel = getLogLevel()
const logger = createLogger(currentLogLevel)

// Define state annotation for the graph
const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
})

// Create a simple weather tool
const weatherTool = new DynamicStructuredTool({
  name: 'get_weather',
  description: 'Get the current weather for a location',
  schema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city and country, e.g., San Francisco, USA',
      },
    },
    required: ['location'],
  } as any,
  func: async ({ location }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const temp = Math.floor(Math.random() * 30) + 10
    return `The weather in ${location} is ${temp}°C with partly cloudy skies.`
  },
})

// Create agent node
const agentNode = async (state: typeof StateAnnotation.State) => {
  const model = new ChatOpenAI({
    model: 'o4-mini',
    streaming: true,
    reasoning: { effort: 'high', summary: 'detailed' },
    useResponsesApi: true,
  }).bindTools([weatherTool])

  const response = await model.invoke(state.messages)
  return { messages: [response] }
}

// Main demo function
const demonstrateStreaming = async () => {
  logger.info('🚀 Starting LangGraph Streaming Tokens Demo')
  logger.info('='.repeat(60))

  // Create simple graph
  const graph = new StateGraph(StateAnnotation)
    .addNode('agent', agentNode)
    .addNode('tools', new ToolNode([weatherTool]))
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', (state) => {
      const lastMessage = state.messages[state.messages.length - 1]
      if (lastMessage.tool_calls?.length > 0) {
        return 'tools'
      }
      return END
    })
    .addEdge('tools', 'agent')

  const compiledGraph = graph.compile()

  const input = {
    messages: [new HumanMessage("What's the current weather in Tokyo, Japan?")],
  }

  logger.info(
    '\n📝 Demo 1: Stream with streamMode: "messages" (Token-by-token)',
  )
  logger.info('-'.repeat(60))

  const stream = await compiledGraph.stream(input, {
    streamMode: 'messages',
  })

  for await (const [message, metadata] of stream) {
    if (isAIMessageChunk(message)) {
      if (message.tool_call_chunks?.length) {
        const toolCallChunk = message.tool_call_chunks[0]
        if (toolCallChunk.name) {
          logger.info(`\n🔧 Tool Call: ${toolCallChunk.name}`)
          process.stdout.write('  Args: ')
        }
        if (toolCallChunk.args) {
          process.stdout.write(toolCallChunk.args)
        }
      } else if (message.content) {
        // Handle content that might be an array of objects
        const content = Array.isArray(message.content) 
          ? message.content.map(c => typeof c === 'object' && c.text ? c.text : c).join('')
          : message.content.toString()
        process.stdout.write(content)
      }
    } else {
      const messageType = message.constructor.name
      if (message.content) {
        logger.info(`\n💬 [${messageType}]: ${message.content}`)
      }
    }
  }

  logger.info('\n\n' + '='.repeat(60))
  logger.info('📝 Demo 2: Stream Events (Detailed event stream)')
  logger.info('-'.repeat(60))

  const input2 = {
    messages: [new HumanMessage("What's the weather in Paris, France?")],
  }

  const eventStream = compiledGraph.streamEvents(input2, {
    version: 'v2',
  })

  for await (const event of eventStream) {
    if (event.event === 'on_chat_model_stream') {
      const chunk = event.data?.chunk as AIMessageChunk
      if (chunk?.content) {
        // Handle content that might be an array of objects
        const content = Array.isArray(chunk.content) 
          ? chunk.content.map(c => typeof c === 'object' && c.text ? c.text : c).join('')
          : chunk.content.toString()
        process.stdout.write(content)
      } else if (chunk?.tool_call_chunks?.length) {
        const toolChunk = chunk.tool_call_chunks[0]
        if (toolChunk.name) {
          logger.info(`\n🔧 Tool call: ${toolChunk.name}`)
          process.stdout.write('  Args: ')
        }
        if (toolChunk.args) {
          process.stdout.write(toolChunk.args)
        }
      }
    } else if (event.event === 'on_tool_start') {
      logger.info(`\n🛠️ Executing tool: ${event.name}`)
    } else if (event.event === 'on_tool_end') {
      logger.info(`  Result: ${event.data?.output}`)
    }
  }

  logger.info('\n\n' + '='.repeat(60))
  logger.info('✅ Demo completed!')
}

// Execute if this file is run directly
if (require.main === module) {
  const main = async () => {
    const envResult = await validateEnvironment()
    if (envResult.isErr()) {
      logger.error('Environment validation failed:', envResult.error)
      process.exit(1)
    }

    logger.info('Environment validation successful')

    try {
      await demonstrateStreaming()
      process.exit(0)
    } catch (error) {
      console.error('Error during execution:', error)
      logger.error(
        'Error during execution:',
        error instanceof Error ? error.message : String(error),
      )
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack)
      }
      process.exit(1)
    }
  }

  main()
}
