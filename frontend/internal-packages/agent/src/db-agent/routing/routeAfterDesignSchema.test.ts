import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import type { WorkflowState } from '../../chat/workflow/types'
import { routeAfterDesignSchema } from './routeAfterDesignSchema'

const workflowState = (messages: WorkflowState['messages']): WorkflowState => ({
  messages,
  userInput: 'test input',
  schemaData: { tables: {} },
  buildingSchemaId: 'test-id',
  latestVersionNumber: 1,
  organizationId: 'test-org',
  userId: 'test-user',
  designSessionId: 'test-session',
  retryCount: {},
})

const createStateWithSchema = (
  messages: WorkflowState['messages'],
  options: { isEmpty?: boolean } = {},
): WorkflowState => {
  const state = workflowState(messages)
  state.schemaData = options.isEmpty
    ? { tables: {} }
    : {
        tables: {
          users: {
            name: 'users',
            columns: {},
            comment: null,
            indexes: {},
            constraints: {},
          },
        },
      }
  return state
}

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

    const state = createStateWithSchema([messageWithToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })

  it('should return generateUsecase when message has no tool calls', () => {
    const messageWithoutToolCalls = new AIMessage({
      content: 'Schema analysis complete',
    })

    const state = createStateWithSchema([messageWithoutToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('generateUsecase')
  })

  it('should return generateUsecase when message has empty tool calls array', () => {
    const messageWithEmptyToolCalls = new AIMessage({
      content: 'No tools needed',
      tool_calls: [],
    })

    const state = createStateWithSchema([messageWithEmptyToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('generateUsecase')
  })

  it('should return generateUsecase for HumanMessage', () => {
    const humanMessage = new HumanMessage({
      content: 'User input',
    })

    const state = createStateWithSchema([humanMessage])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('generateUsecase')
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

    const state = createStateWithSchema([
      messageWithToolCalls,
      messageWithoutToolCalls,
    ])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('generateUsecase')
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

    const state = createStateWithSchema([messageWithMultipleToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })

  it('should return invokeSchemaDesignTool when schema is empty (no tables)', () => {
    const messageWithoutToolCalls = new AIMessage({
      content: 'Schema analysis complete',
    })

    const state = createStateWithSchema([messageWithoutToolCalls], {
      isEmpty: true,
    })

    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })

  it('should return invokeSchemaDesignTool when schema is empty even with human message', () => {
    const humanMessage = new HumanMessage({
      content: 'Create a user table',
    })

    const state = createStateWithSchema([humanMessage], { isEmpty: true })

    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })

  it('should prioritize empty schema check over AI tool calls', () => {
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

    const state = createStateWithSchema([messageWithToolCalls], {
      isEmpty: true,
    })

    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })

  it('should use AI decision when schema has tables', () => {
    const messageWithoutToolCalls = new AIMessage({
      content: 'Schema analysis complete',
    })

    const state = createStateWithSchema([messageWithoutToolCalls])

    const result = routeAfterDesignSchema(state)

    expect(result).toBe('generateUsecase')
  })
})
