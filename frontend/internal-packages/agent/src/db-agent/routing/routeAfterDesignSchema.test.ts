import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import type { DbAgentState } from '../shared/dbAgentAnnotation'
import { routeAfterDesignSchema } from './routeAfterDesignSchema'

const dbAgentState = (messages: DbAgentState['messages']): DbAgentState => ({
  messages,
  schemaData: { tables: {}, enums: {}, extensions: {} },
  buildingSchemaId: 'test-id',
  latestVersionNumber: 1,
  organizationId: 'test-org',
  userId: 'test-user',
  designSessionId: 'test-session',
  prompt: 'test input',
  next: END,
})

describe('routeAfterDesignSchema', () => {
  it('should return invokeSchemaDesignTool when message has tool calls', () => {
    const messageWithToolCalls = new AIMessage({
      content: 'I need to update the schema',
      tool_calls: [
        {
          name: 'schemaDesignTool',
          args: { operations: [] },
          id: 'test-id',
        },
      ],
    })

    const state = dbAgentState([messageWithToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })

  it('should return generateTestcase when message has no tool calls', () => {
    const messageWithoutToolCalls = new AIMessage({
      content: 'Schema analysis complete',
    })

    const state = dbAgentState([messageWithoutToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('generateTestcase')
  })

  it('should return generateTestcase when message has empty tool calls array', () => {
    const messageWithEmptyToolCalls = new AIMessage({
      content: 'No tools needed',
      tool_calls: [],
    })

    const state = dbAgentState([messageWithEmptyToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('generateTestcase')
  })

  it('should return generateTestcase for HumanMessage', () => {
    const humanMessage = new HumanMessage({
      content: 'User input',
    })

    const state = dbAgentState([humanMessage])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('generateTestcase')
  })

  it('should handle multiple messages and check only the last one', () => {
    const messageWithToolCalls = new AIMessage({
      content: 'I need to update the schema',
      tool_calls: [
        {
          name: 'schemaDesignTool',
          args: { operations: [] },
          id: 'test-id',
        },
      ],
    })

    const messageWithoutToolCalls = new AIMessage({
      content: 'Schema analysis complete',
    })

    const state = dbAgentState([messageWithToolCalls, messageWithoutToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('generateTestcase')
  })

  it('should handle multiple tool calls', () => {
    const messageWithMultipleToolCalls = new AIMessage({
      content: 'I need to update the schema',
      tool_calls: [
        {
          name: 'schemaDesignTool',
          args: { operations: [] },
          id: 'test-id-1',
        },
        {
          name: 'schemaDesignTool',
          args: { operations: [] },
          id: 'test-id-2',
        },
      ],
    })

    const state = dbAgentState([messageWithMultipleToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })
})
