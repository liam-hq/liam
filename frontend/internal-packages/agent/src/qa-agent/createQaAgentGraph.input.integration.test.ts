import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStreamEvents,
} from '../../test-utils/workflowTestHelpers'
import { createQaAgentGraph } from './createQaAgentGraph'
import type { QaAgentState } from './shared/qaAgentAnnotation'

describe('createQaAgentGraph with input.json Integration', () => {
  it('should execute QA agent workflow with input.json data', async () => {
    // Arrange
    const graph = createQaAgentGraph()
    const { config, context } = await getTestConfig()

    // Load input.json from project root
    const inputPath = resolve(__dirname, '../../../../../input.json')
    console.log('Loading input from:', inputPath)
    const inputData = JSON.parse(readFileSync(inputPath, 'utf-8'))

    // Transform messages from serialized format to Message objects
    const messages = inputData.messages.map((msg: any) => {
      if (msg.kwargs.name === 'pm' || msg.kwargs.name === 'db') {
        // This is an AIMessage with tool calls
        return new AIMessage({
          content: msg.kwargs.content || '',
          id: msg.kwargs.id,
          name: msg.kwargs.name,
          tool_calls: msg.kwargs.tool_calls || [],
          additional_kwargs: msg.kwargs.additional_kwargs || {},
        })
      }
      // This is a HumanMessage
      return new HumanMessage({
        content: msg.kwargs.content,
        id: msg.kwargs.id,
      })
    })

    // Transform analyzedRequirements to ensure all items have IDs
    const analyzedRequirements = inputData.analyzedRequirements
    
    // Add IDs to requirement items if they don't have them
    const addIdsToRequirements = (requirements: any) => {
      const result: any = {}
      for (const [category, items] of Object.entries(requirements)) {
        if (Array.isArray(items)) {
          result[category] = items.map((item: any, index: number) => {
            if (typeof item === 'string') {
              return {
                id: `req-${category}-${index}`,
                desc: item,
              }
            }
            return item // Already has the right structure
          })
        } else {
          result[category] = items
        }
      }
      return result
    }

    if (analyzedRequirements.functionalRequirements) {
      analyzedRequirements.functionalRequirements = addIdsToRequirements(
        analyzedRequirements.functionalRequirements
      )
    }
    
    if (analyzedRequirements.nonFunctionalRequirements) {
      analyzedRequirements.nonFunctionalRequirements = addIdsToRequirements(
        analyzedRequirements.nonFunctionalRequirements
      )
    }

    // Create the state for QA agent
    const state: QaAgentState = {
      messages,
      schemaData: inputData.schemaData,
      analyzedRequirements,
      testcases: inputData.testcases || [],
      designSessionId: inputData.designSessionId || context.designSessionId,
      buildingSchemaId: inputData.buildingSchemaId || context.buildingSchemaId,
      latestVersionNumber: inputData.latestVersionNumber || context.latestVersionNumber,
      schemaIssues: inputData.schemaIssues || [],
      next: END,
    }

    console.log('\n=== Starting QA Agent with loaded input ===')
    console.log('Schema tables:', Object.keys(inputData.schemaData.tables || {}))
    console.log('Functional requirement categories:', Object.keys(analyzedRequirements.functionalRequirements || {}))
    console.log('Non-functional requirement categories:', Object.keys(analyzedRequirements.nonFunctionalRequirements || {}))

    // Act
    const streamEvents = graph.streamEvents(state, {
      ...config,
      streamMode: 'messages',
      version: 'v2',
    })

    // Assert (Output)
    await outputStreamEvents(streamEvents)
  })
})