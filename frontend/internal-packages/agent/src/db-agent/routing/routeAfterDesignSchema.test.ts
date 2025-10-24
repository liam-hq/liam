import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import type { DbAgentState } from '../shared/dbAgentAnnotation'
import { routeAfterDesignSchema } from './routeAfterDesignSchema'

const createDbAgentState = (
  messages: DbAgentState['messages'],
): DbAgentState => ({
  messages,
  schemaData: { tables: {}, enums: {}, extensions: {} },
  organizationId: 'test-org',
  userId: 'test-user',
  designSessionId: 'test-session',
  prompt: 'test input',
  next: END,
  schemaDesignSuccessful: false,
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

  it('should return END when message has no tool calls (design complete)', () => {
    const messageWithoutToolCalls = new AIMessage({
      content: 'Schema design is complete',
    })

    const state = createDbAgentState([messageWithoutToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe(END)
  })

  it('should return END when message has empty tool calls array (design complete)', () => {
    const messageWithEmptyToolCalls = new AIMessage({
      content: 'Schema design is complete, no tools needed',
      tool_calls: [],
    })

    const state = createDbAgentState([messageWithEmptyToolCalls])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe(END)
  })

  it('should return END for HumanMessage (no tool calls)', () => {
    const humanMessage = new HumanMessage({
      content: 'User input',
    })

    const state = createDbAgentState([humanMessage])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe(END)
  })

  it('should handle multiple messages and check only the last one (return END when last has no tools)', () => {
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
      content: 'Schema design is complete',
    })

    const state = createDbAgentState([
      messageWithToolCalls,
      messageWithoutToolCalls,
    ])
    const result = routeAfterDesignSchema(state)

    expect(result).toBe(END)
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
