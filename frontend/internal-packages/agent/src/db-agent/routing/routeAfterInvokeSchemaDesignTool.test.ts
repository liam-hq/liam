import { AIMessage, ToolMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import type { DbAgentState } from '../shared/dbAgentAnnotation'
import { routeAfterInvokeSchemaDesignTool } from './routeAfterInvokeSchemaDesignTool'

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

describe('routeAfterInvokeSchemaDesignTool', () => {
  it('should return END when tool execution is successful', () => {
    const successMessage = new ToolMessage({
      content:
        'Schema successfully updated. The operations have been applied to the database schema, DDL validation successful (3/3 statements executed successfully), and new version created.',
      tool_call_id: 'test-tool-call-id',
      name: 'schemaDesignTool',
    })

    const state = createDbAgentState([successMessage])
    const result = routeAfterInvokeSchemaDesignTool(state)

    expect(result).toBe('END')
  })

  it('should return designSchema when tool execution fails', () => {
    const errorMessage = new ToolMessage({
      content: 'Error: Failed to apply schema changes',
      tool_call_id: 'test-tool-call-id',
      name: 'schemaDesignTool',
    })

    const state = createDbAgentState([errorMessage])
    const result = routeAfterInvokeSchemaDesignTool(state)

    expect(result).toBe('designSchema')
  })

  it('should return designSchema when tool returns partial success', () => {
    const partialSuccessMessage = new ToolMessage({
      content: 'DDL validation partial: 2/3 statements executed successfully',
      tool_call_id: 'test-tool-call-id',
      name: 'schemaDesignTool',
    })

    const state = createDbAgentState([partialSuccessMessage])
    const result = routeAfterInvokeSchemaDesignTool(state)

    expect(result).toBe('designSchema')
  })

  it('should return designSchema when last message is not a ToolMessage', () => {
    const aiMessage = new AIMessage({
      content: 'Processing schema design',
    })

    const state = createDbAgentState([aiMessage])
    const result = routeAfterInvokeSchemaDesignTool(state)

    expect(result).toBe('designSchema')
  })

  it('should return designSchema when tool message is from different tool', () => {
    const differentToolMessage = new ToolMessage({
      content: 'Some other tool result',
      tool_call_id: 'test-tool-call-id',
      name: 'differentTool',
    })

    const state = createDbAgentState([differentToolMessage])
    const result = routeAfterInvokeSchemaDesignTool(state)

    expect(result).toBe('designSchema')
  })

  it('should handle multiple messages and check only the last one', () => {
    const successMessage = new ToolMessage({
      content: 'Schema successfully updated',
      tool_call_id: 'test-tool-call-id-1',
      name: 'schemaDesignTool',
    })

    const errorMessage = new ToolMessage({
      content: 'Error occurred',
      tool_call_id: 'test-tool-call-id-2',
      name: 'schemaDesignTool',
    })

    // Error message is last, so should retry
    const state = createDbAgentState([successMessage, errorMessage])
    const result = routeAfterInvokeSchemaDesignTool(state)

    expect(result).toBe('designSchema')
  })

  it('should return END when success message is last', () => {
    const errorMessage = new ToolMessage({
      content: 'Error occurred',
      tool_call_id: 'test-tool-call-id-1',
      name: 'schemaDesignTool',
    })

    const successMessage = new ToolMessage({
      content: 'Schema successfully updated',
      tool_call_id: 'test-tool-call-id-2',
      name: 'schemaDesignTool',
    })

    // Success message is last, so should end
    const state = createDbAgentState([errorMessage, successMessage])
    const result = routeAfterInvokeSchemaDesignTool(state)

    expect(result).toBe('END')
  })
})
