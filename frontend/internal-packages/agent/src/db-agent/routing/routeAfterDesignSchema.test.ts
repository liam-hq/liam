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

    const state = workflowState([messageWithToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })

  it('should return executeDDL when message has no tool calls', () => {
    const messageWithoutToolCalls = new AIMessage({
      content: 'Schema analysis complete',
    })

    const state = workflowState([messageWithoutToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('executeDDL')
  })

  it('should return executeDDL when message has empty tool calls array', () => {
    const messageWithEmptyToolCalls = new AIMessage({
      content: 'No tools needed',
      tool_calls: [],
    })

    const state = workflowState([messageWithEmptyToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('executeDDL')
  })

  it('should return executeDDL for HumanMessage', () => {
    const humanMessage = new HumanMessage({
      content: 'User input',
    })

    const state = workflowState([humanMessage])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('executeDDL')
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

    const state = workflowState([messageWithToolCalls, messageWithoutToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('executeDDL')
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

    const state = workflowState([messageWithMultipleToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe('invokeSchemaDesignTool')
  })
})
