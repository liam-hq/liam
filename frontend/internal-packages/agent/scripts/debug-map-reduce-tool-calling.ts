#!/usr/bin/env tsx

import { resolve } from 'node:path'
import { config } from 'dotenv'
import { ChatOpenAI } from '@langchain/openai'
import { StateGraph, Annotation, START, END } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

// Load environment variables from ../../../../.env
config({ path: resolve(__dirname, '../../../../.env') })

// Validate environment
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required in .env file')
  process.exit(1)
}

// Enable LangSmith tracing if configured
if (process.env.LANGCHAIN_API_KEY) {
  process.env.LANGCHAIN_TRACING_V2 = 'true'
  process.env.LANGCHAIN_PROJECT = process.env.LANGCHAIN_PROJECT || 'debug-map-reduce-tool-calling'
  console.log('📊 LangSmith tracing enabled')
  console.log(`   Project: ${process.env.LANGCHAIN_PROJECT}`)
}

// Initialize the model
const model = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
})

// Helper model for internal tool logic
const helperModel = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
})

// Define the state with reducers for parallel aggregation
const MapReduceState = Annotation.Root({
  topic: Annotation<string>({
    reducer: (_, b) => b,
  }),
  subjects: Annotation<string[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  jokes: Annotation<string[]>({
    reducer: (a, b) => a.concat(b),
    default: () => [],
  }),
  best_joke: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (a, b) => a.concat(b),
    default: () => [],
  }),
  phase: Annotation<'subjects' | 'jokes' | 'select' | 'done'>({
    reducer: (_, b) => b,
    default: () => 'subjects',
  }),
})

// Tool: Generate subjects related to a topic
const generateSubjectsTool = tool(
  async ({ topic }: { topic: string }) => {
    console.log('🔍 Tool: Generating subjects for topic:', topic)
    
    const prompt = `Given the topic "${topic}", generate 3-5 related subjects that would be good for making jokes about. 
    Be creative and think of different aspects or related concepts.
    Return as a JSON array of strings.`
    
    const response = await helperModel.invoke([new HumanMessage(prompt)])
    const content = response.content as string
    
    // Parse the response to extract subjects
    try {
      const subjects = JSON.parse(content.match(/\[.*\]/s)?.[0] || '[]')
      console.log('📝 Generated subjects:', subjects)
      return { subjects }
    } catch {
      // Fallback parsing
      const subjects = content.split('\n').filter(line => line.trim()).slice(0, 5)
      console.log('📝 Generated subjects (fallback):', subjects)
      return { subjects }
    }
  },
  {
    name: 'generate_subjects',
    description: 'Generate related subjects for making jokes about a topic',
    schema: z.object({
      topic: z.string().describe('The main topic to generate subjects for'),
    }),
  }
)

// Tool: Generate a joke for a specific subject
const generateJokeTool = tool(
  async ({ subject }: { subject: string }) => {
    console.log(`  🎭 Tool: Generating joke for: ${subject}`)
    
    const prompt = `Create a funny, clever joke about "${subject}". 
    Make it original and entertaining. It can be a pun, one-liner, or short setup-punchline joke.
    Return just the joke text, nothing else.`
    
    const response = await helperModel.invoke([new HumanMessage(prompt)])
    const joke = response.content as string
    
    console.log(`  ✅ Generated joke for ${subject}`)
    return { joke }
  },
  {
    name: 'generate_joke',
    description: 'Generate a funny joke about a specific subject',
    schema: z.object({
      subject: z.string().describe('The subject to create a joke about'),
    }),
  }
)

// Tool: Select the best joke from a collection
const selectBestJokeTool = tool(
  async ({ jokes }: { jokes: string[] }) => {
    console.log('🏆 Tool: Selecting best joke from', jokes.length, 'jokes')
    
    if (jokes.length === 0) {
      return { best_joke: null, reason: 'No jokes to select from' }
    }
    
    const jokesText = jokes.map((joke, idx) => `${idx + 1}. ${joke}`).join('\n\n')
    
    const prompt = `Here are several jokes:

${jokesText}

Select the BEST joke from this collection. Consider humor, cleverness, originality, and entertainment value.
Return your response as JSON with two fields:
- "best_joke": the exact text of the best joke
- "reason": why this joke was selected`
    
    const response = await helperModel.invoke([new HumanMessage(prompt)])
    const content = response.content as string
    
    try {
      const result = JSON.parse(content.match(/\{.*\}/s)?.[0] || '{}')
      console.log('🌟 Best joke selected!')
      console.log('   Reason:', result.reason)
      return result
    } catch {
      // Fallback to first joke
      return {
        best_joke: jokes[0],
        reason: 'Selected as fallback'
      }
    }
  },
  {
    name: 'select_best_joke',
    description: 'Select the best joke from a collection of jokes',
    schema: z.object({
      jokes: z.array(z.string()).describe('Collection of jokes to choose from'),
    }),
  }
)

// Bind tools to the model
const tools = [generateSubjectsTool, generateJokeTool, selectBestJokeTool]
const modelWithTools = model.bindTools(tools)

// Create ToolNode to execute tool calls
const toolNode = new ToolNode(tools)

// Agent node: Decides what tools to call based on current phase
async function agent(state: typeof MapReduceState.State) {
  const { phase, topic, subjects, jokes, messages } = state
  
  console.log(`\n🤖 Agent phase: ${phase}`)
  
  let prompt: string
  let nextPhase: typeof phase = phase
  
  switch (phase) {
    case 'subjects':
      // Phase 1: Generate subjects
      prompt = `We need to generate jokes about the topic "${topic}".
First, use the generate_subjects tool to create a list of related subjects for making jokes.`
      nextPhase = 'jokes'
      break
      
    case 'jokes':
      // Phase 2: Generate jokes for each subject (multiple tool calls)
      if (!subjects || subjects.length === 0) {
        return { phase: 'subjects' } // Go back if no subjects
      }
      
      prompt = `Now generate jokes for these subjects: ${subjects.join(', ')}.
IMPORTANT: Call the generate_joke tool SEPARATELY for EACH subject.
You should make ${subjects.length} separate tool calls.`
      nextPhase = 'select'
      break
      
    case 'select':
      // Phase 3: Select the best joke
      if (!jokes || jokes.length === 0) {
        return { phase: 'jokes' } // Go back if no jokes
      }
      
      prompt = `We have generated ${jokes.length} jokes. 
Now use the select_best_joke tool to choose the best one from this collection.
The jokes are: ${JSON.stringify(jokes)}`
      nextPhase = 'done'
      break
      
    default:
      return { phase: 'done' }
  }
  
  // Get AI response with tool calls
  const response = await modelWithTools.invoke([
    new HumanMessage(prompt),
    ...messages
  ])
  
  // Update state with new message and phase
  return {
    messages: [response],
    phase: response.tool_calls && response.tool_calls.length > 0 ? phase : nextPhase
  }
}

// Condition function to determine next node
function shouldContinue(state: typeof MapReduceState.State) {
  const { messages, phase } = state
  
  if (phase === 'done') {
    return END
  }
  
  // Check if last message has tool calls
  const lastMessage = messages[messages.length - 1]
  if (lastMessage && 'tool_calls' in lastMessage && 
      Array.isArray((lastMessage as AIMessage).tool_calls) && 
      (lastMessage as AIMessage).tool_calls?.length) {
    return 'tools'
  }
  
  return 'agent'
}

// Tool result processor: Updates state based on tool results
async function processToolResults(state: typeof MapReduceState.State) {
  const { messages, phase } = state
  
  // Get the last tool message results
  const toolMessages = messages.filter(m => m._getType() === 'tool')
  if (toolMessages.length === 0) return {}
  
  const updates: Partial<typeof MapReduceState.State> = {}
  
  // Process based on current phase
  if (phase === 'subjects') {
    // Extract subjects from tool results
    const lastToolMessage = toolMessages[toolMessages.length - 1]
    const content = typeof lastToolMessage.content === 'string' 
      ? JSON.parse(lastToolMessage.content)
      : lastToolMessage.content
    if (content.subjects) {
      updates.subjects = content.subjects
      updates.phase = 'jokes'
    }
  } else if (phase === 'jokes') {
    // Extract jokes from tool results
    const newJokes: string[] = []
    for (const msg of toolMessages) {
      const content = typeof msg.content === 'string' 
        ? JSON.parse(msg.content)
        : msg.content
      if (content.joke) {
        newJokes.push(content.joke)
      }
    }
    if (newJokes.length > 0) {
      updates.jokes = newJokes
      updates.phase = 'select'
    }
  } else if (phase === 'select') {
    // Extract best joke from tool results
    const lastToolMessage = toolMessages[toolMessages.length - 1]
    const content = typeof lastToolMessage.content === 'string' 
      ? JSON.parse(lastToolMessage.content)
      : lastToolMessage.content
    if (content.best_joke) {
      updates.best_joke = content.best_joke
      updates.phase = 'done'
    }
  }
  
  return updates
}

// Build the graph
async function buildMapReduceGraph() {
  const graph = new StateGraph(MapReduceState)
    // Add nodes
    .addNode('agent', agent)
    .addNode('tools', toolNode)
    .addNode('process_results', processToolResults)
    
    // Define the flow
    .addEdge(START, 'agent')
    
    // Conditional routing based on tool calls
    .addConditionalEdges('agent', shouldContinue, {
      'tools': 'tools',
      'agent': 'agent',
      [END]: END,
    })
    
    // After tools execution, process results
    .addEdge('tools', 'process_results')
    .addEdge('process_results', 'agent')
  
  return graph.compile()
}

// Main execution function
async function debug() {
  console.log('🔍 Starting Map-Reduce with Tool Calling Debug Script')
  console.log('─'.repeat(50))
  
  try {
    // Build the graph
    const workflow = await buildMapReduceGraph()
    
    // Test topic
    const topic = 'artificial intelligence'
    
    console.log(`📌 Topic: "${topic}"`)
    console.log('─'.repeat(50))
    
    // Execute the workflow
    const startTime = Date.now()
    const result = await workflow.invoke({
      topic,
      phase: 'subjects',
    })
    const duration = Date.now() - startTime
    
    console.log('─'.repeat(50))
    console.log('📊 Results:')
    console.log('  Subjects:', result.subjects)
    console.log('  Total jokes generated:', result.jokes.length)
    console.log('  Execution time:', `${duration}ms`)
    console.log('─'.repeat(50))
    
    // Display all jokes
    if (result.jokes.length > 0) {
      console.log('🎭 All Generated Jokes:')
      result.jokes.forEach((joke, idx) => {
        console.log(`\n  ${idx + 1}. ${joke}`)
      })
      
      console.log('─'.repeat(50))
      console.log('🏆 Best Joke:')
      console.log(`  ${result.best_joke}`)
    }
    
    console.log('─'.repeat(50))
    console.log('✅ Map-Reduce with Tool Calling completed successfully!')
    
    if (process.env.LANGCHAIN_API_KEY) {
      console.log('📊 View trace in LangSmith: https://smith.langchain.com')
    }
  } catch (error) {
    console.error('❌ Error during execution:', error)
    throw error
  }
}

// Execute
debug().catch((err) => {
  console.error('❌ Debug script failed:', err)
  process.exit(1)
})