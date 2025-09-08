import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import type { DbAgentState } from '../shared/dbAgentAnnotation'
import { routeAfterDesignSchema } from './routeAfterDesignSchema'

const createDbAgentState = (
  messages: DbAgentState['messages'],
  designSchemaRetryCount = 0,
): DbAgentState => ({
  messages,
  schemaData: { tables: {}, enums: {}, extensions: {} },
  buildingSchemaId: 'test-id',
  latestVersionNumber: 1,
  organizationId: 'test-org',
  userId: 'test-user',
  designSessionId: 'test-session',
  next: END,
  designSchemaRetryCount,
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

    const state = createDbAgentState([messageWithToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })

  it('should return designSchema for retry when message has no tool calls and retry count is below limit', () => {
    const messageWithoutToolCalls = new AIMessage({
      content: 'Schema analysis complete',
    })

    const state = createDbAgentState([messageWithoutToolCalls], 1)
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('designSchema')
  })

  it('should return designSchema when message has empty tool calls array', () => {
    const messageWithEmptyToolCalls = new AIMessage({
      content: 'No tools needed',
      tool_calls: [],
    })

    const state = createDbAgentState([messageWithEmptyToolCalls], 0)
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('designSchema')
  })

  it('should return designSchema for HumanMessage', () => {
    const humanMessage = new HumanMessage({
      content: 'User input',
    })

    const state = createDbAgentState([humanMessage], 0)
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('designSchema')
  })

  it('should throw error when retry count reaches maximum', () => {
    const messageWithoutToolCalls = new AIMessage({
      content: 'Schema analysis complete',
    })

    const state = createDbAgentState([messageWithoutToolCalls], 3)

    expect(() => routeAfterDesignSchema(state)).toThrow(
      WorkflowTerminationError,
    )
    expect(() => routeAfterDesignSchema(state)).toThrow(
      'Failed to design schema with tool usage after 3 attempts',
    )
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

    const state = createDbAgentState(
      [messageWithToolCalls, messageWithoutToolCalls],
      0,
    )
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('designSchema')
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

    const state = createDbAgentState([messageWithMultipleToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })
})
