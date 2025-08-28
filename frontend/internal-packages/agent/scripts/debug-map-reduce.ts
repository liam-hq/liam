#!/usr/bin/env tsx

import { resolve } from 'node:path'
import { config } from 'dotenv'
import { ChatOpenAI } from '@langchain/openai'
import { StateGraph, Annotation, Send, START, END } from '@langchain/langgraph'
import { BaseMessage, HumanMessage } from '@langchain/core/messages'

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
  process.env.LANGCHAIN_PROJECT = process.env.LANGCHAIN_PROJECT || 'debug-map-reduce'
  console.log('📊 LangSmith tracing enabled')
  console.log(`   Project: ${process.env.LANGCHAIN_PROJECT}`)
}

// Initialize the model
const model = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
})

// Type definitions for structured output
interface SubjectsResponse {
  subjects: string[]
}

interface JokeResponse {
  joke: string
}

interface BestJokeResponse {
  joke: string
  reason: string
}

// Define schemas for structured output using JSON Schema
const SubjectsSchema = {
  type: 'object',
  properties: {
    subjects: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of subjects related to the topic',
    },
  },
  required: ['subjects'],
  additionalProperties: false,
} as const

const JokeSchema = {
  type: 'object',
  properties: {
    joke: {
      type: 'string',
      description: 'A funny joke about the subject',
    },
  },
  required: ['joke'],
  additionalProperties: false,
} as const

const BestJokeSchema = {
  type: 'object',
  properties: {
    joke: {
      type: 'string',
      description: 'The best joke from the collection',
    },
    reason: {
      type: 'string',
      description: 'Why this joke was selected as the best',
    },
  },
  required: ['joke', 'reason'],
  additionalProperties: false,
} as const

// Define the state with reducers for parallel aggregation
const MapReduceState = Annotation.Root({
  topic: Annotation<string>({
    reducer: (_, b) => b, // Always use the latest value
  }),
  subjects: Annotation<string[]>({
    reducer: (_, b) => b, // Replace with new subjects
  }),
  jokes: Annotation<string[]>({
    reducer: (a, b) => a.concat(b), // Aggregate jokes from parallel executions
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
})

// Node: Generate subjects related to the topic
async function generateSubjects(state: typeof MapReduceState.State) {
  console.log('🔍 Generating subjects for topic:', state.topic)
  
  const prompt = `Given the topic "${state.topic}", generate 3-5 related subjects that would be good for making jokes about. 
  Be creative and think of different aspects or related concepts.`
  
  const response = await model
    .withStructuredOutput<SubjectsResponse>(SubjectsSchema)
    .invoke([new HumanMessage(prompt)])
  
  console.log('📝 Generated subjects:', response.subjects)
  
  return {
    subjects: response.subjects,
    messages: [new HumanMessage(`Generated subjects: ${response.subjects.join(', ')}`)]
  }
}

// Node: Generate a joke for a specific subject
async function generateJoke(state: { subject: string }) {
  console.log(`  🎭 Generating joke for: ${state.subject}`)
  
  const prompt = `Create a funny, clever joke about "${state.subject}". 
  Make it original and entertaining. It can be a pun, one-liner, or short setup-punchline joke.`
  
  const response = await model
    .withStructuredOutput<JokeResponse>(JokeSchema)
    .invoke([new HumanMessage(prompt)])
  
  console.log(`  ✅ Generated joke for ${state.subject}`)
  
  return {
    jokes: [response.joke],
  }
}

// Node: Select the best joke from all generated jokes
async function selectBestJoke(state: typeof MapReduceState.State) {
  console.log('🏆 Selecting best joke from', state.jokes.length, 'jokes')
  
  if (state.jokes.length === 0) {
    return { best_joke: null }
  }
  
  const jokesText = state.jokes.map((joke, idx) => `${idx + 1}. ${joke}`).join('\n\n')
  
  const prompt = `Here are several jokes:

${jokesText}

Select the BEST joke from this collection. Consider humor, cleverness, originality, and entertainment value.`
  
  const response = await model
    .withStructuredOutput<BestJokeResponse>(BestJokeSchema)
    .invoke([new HumanMessage(prompt)])
  
  console.log('🌟 Best joke selected!')
  console.log('   Reason:', response.reason)
  
  return {
    best_joke: response.joke,
    messages: [new HumanMessage(`Best joke: ${response.joke}\nReason: ${response.reason}`)]
  }
}

// Conditional edge function using Send API for parallel execution
function continueToJokes(state: typeof MapReduceState.State) {
  console.log('🚀 Dispatching parallel joke generation for', state.subjects.length, 'subjects')
  
  // Create a Send object for each subject
  // This will invoke generate_joke node in parallel for each subject
  return state.subjects.map((subject) => {
    return new Send('generate_joke', { subject })
  })
}

// Build the graph
async function buildMapReduceGraph() {
  const graph = new StateGraph(MapReduceState)
    // Add nodes
    .addNode('generate_subjects', generateSubjects)
    .addNode('generate_joke', generateJoke)
    .addNode('select_best', selectBestJoke)
    
    // Define the flow
    .addEdge(START, 'generate_subjects')
    
    // Use conditional edge with Send for parallel execution
    .addConditionalEdges('generate_subjects', continueToJokes)
    
    // After all parallel executions complete, move to selection
    .addEdge('generate_joke', 'select_best')
    .addEdge('select_best', END)
  
  return graph.compile()
}

// Main execution function
async function debug() {
  console.log('🔍 Starting Map-Reduce Debug Script')
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
    })
    const duration = Date.now() - startTime
    
    console.log('─'.repeat(50))
    console.log('📊 Results:')
    console.log('  Subjects:', result.subjects)
    console.log('  Total jokes generated:', result.jokes.length)
    console.log('  Execution time:', `${duration}ms`)
    console.log('─'.repeat(50))
    
    // Display all jokes
    console.log('🎭 All Generated Jokes:')
    result.jokes.forEach((joke, idx) => {
      console.log(`\n  ${idx + 1}. ${joke}`)
    })
    
    console.log('─'.repeat(50))
    console.log('🏆 Best Joke:')
    console.log(`  ${result.best_joke}`)
    
    console.log('─'.repeat(50))
    console.log('✅ Map-Reduce debug completed successfully!')
    
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