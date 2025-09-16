#!/usr/bin/env node

// === Debug LangGraph messagesStateReducer Behavior ===
// This script tests different approaches to adding messages with messagesStateReducer
// to observe the actual behavior and compare it with documented expectations.
// Reference: https://langchain-ai.github.io/langgraphjs/concepts/low_level/#reducers

import { Annotation, MessagesAnnotation, StateGraph, START, END } from '@langchain/langgraph'
import { HumanMessage, AIMessage } from '@langchain/core/messages'

// === Test State Definition ===
const TestState = Annotation.Root({
  ...MessagesAnnotation.spec,
  testCase: Annotation<string>,
})

type TestStateType = typeof TestState.State

// === Helper Functions ===
function logMessages(label: string, messages: any[]) {
  console.log(`\n📋 ${label}`)
  console.log(`   Count: ${messages.length}`)
  messages.forEach((msg, i) => {
    const type = msg.constructor.name
    const content = typeof msg.content === 'string' ? msg.content.slice(0, 30) : 'complex'
    console.log(`   [${i}] ${type}: "${content}${content.length === 30 ? '...' : ''}"`)
  })
}

// === Test Nodes ===
const spreadApproachNode = (state: TestStateType) => {
  console.log('\n🧪 APPROACH A: Manually spreading existing messages')
  console.log('   Code: [...state.messages, newMessage]')

  const newMessage = new AIMessage('Added via spread approach')

  return {
    messages: [...state.messages, newMessage],
    testCase: 'spread'
  }
}

const directApproachNode = (state: TestStateType) => {
  console.log('\n🧪 APPROACH B: Let reducer handle concatenation')
  console.log('   Code: newMessage')

  const newMessage = new AIMessage('Added via direct approach')

  return {
    messages: newMessage,
    testCase: 'direct'
  }
}

const multipleMessagesNode = (state: TestStateType) => {
  console.log('\n🧪 APPROACH C: Adding multiple new messages')
  console.log('   Code: [message1, message2]')

  const messages = [
    new HumanMessage('First new message'),
    new AIMessage('Second new message')
  ]

  return {
    messages: messages,
    testCase: 'multiple'
  }
}

// === Debug Function ===
async function debug() {
  console.log('🔍 Starting LangGraph messagesStateReducer debug')
  console.log('─'.repeat(60))

  // Initial state with some existing messages
  const initialMessages = [
    new HumanMessage('Hello, I need help with my database'),
    new AIMessage('I can help you with database design. What do you need?')
  ]

  console.log('🏁 Initial State:')
  logMessages('Starting messages', initialMessages)

  // === Test Case 1: Spread Approach ===
  console.log('\n' + '='.repeat(60))
  console.log('TEST CASE 1: SPREAD APPROACH')
  console.log('='.repeat(60))

  const spreadGraph = new StateGraph(TestState)
    .addNode('process', spreadApproachNode)
    .addEdge(START, 'process')
    .addEdge('process', END)
    .compile()

  const spreadResult = await spreadGraph.invoke({
    messages: initialMessages,
    testCase: 'start'
  })

  logMessages('After spread approach', spreadResult.messages)

  // === Test Case 2: Direct Approach ===
  console.log('\n' + '='.repeat(60))
  console.log('TEST CASE 2: DIRECT APPROACH')
  console.log('='.repeat(60))

  const directGraph = new StateGraph(TestState)
    .addNode('process', directApproachNode)
    .addEdge(START, 'process')
    .addEdge('process', END)
    .compile()

  const directResult = await directGraph.invoke({
    messages: initialMessages,
    testCase: 'start'
  })

  logMessages('After direct approach', directResult.messages)

  // === Test Case 3: Multiple Messages Approach ===
  console.log('\n' + '='.repeat(60))
  console.log('TEST CASE 3: MULTIPLE MESSAGES APPROACH')
  console.log('='.repeat(60))

  const multipleGraph = new StateGraph(TestState)
    .addNode('process', multipleMessagesNode)
    .addEdge(START, 'process')
    .addEdge('process', END)
    .compile()

  const multipleResult = await multipleGraph.invoke({
    messages: initialMessages,
    testCase: 'start'
  })

  logMessages('After multiple messages approach', multipleResult.messages)

  // === Analysis ===
  console.log('\n' + '='.repeat(60))
  console.log('ANALYSIS')
  console.log('='.repeat(60))

  console.log('📊 Results comparison:')
  console.log(`   Spread approach:    ${spreadResult.messages.length} messages`)
  console.log(`   Direct approach:    ${directResult.messages.length} messages`)
  console.log(`   Multiple approach:  ${multipleResult.messages.length} messages`)
  console.log(`   Initial count:      ${initialMessages.length} messages`)

  console.log('\n🔍 Observations:')
  const hasDuplication = spreadResult.messages.length > directResult.messages.length
  if (hasDuplication) {
    console.log('   ⚠️  Spread approach resulted in different message count')
    console.log('   📖 Documentation suggestion appears correct')
  } else {
    console.log('   ✨ Both approaches resulted in same message count')
    console.log('   🤔 No observable duplication in this test case')
  }

  console.log('\n📖 Documentation recommends: Use direct message passing')
  console.log('🔗 Reference: https://langchain-ai.github.io/langgraphjs/concepts/low_level/#reducers')

  console.log('\n─'.repeat(60))
  console.log('✅ Debug completed')
}

// === Execute ===
debug().catch(err => {
  console.error('❌ Debug failed:', err)
  process.exit(1)
})