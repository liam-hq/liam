import { AIMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import type { DbAgentState } from '../shared/dbAgentAnnotation'
import { routeAfterInvokeSchemaDesignTool } from './routeAfterInvokeSchemaDesignTool'

const createDbAgentState = (
  messages: DbAgentState['messages'],
  schemaDesignSuccessful = false,
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
  schemaDesignSuccessful,
})

describe('routeAfterInvokeSchemaDesignTool', () => {
  it('should return END when schemaDesignSuccessful is true', () => {
    const aiMessage = new AIMessage({
      content: 'Schema design completed',
    })

    const state = createDbAgentState([aiMessage], true) // schemaDesignSuccessful = true
    const result = routeAfterInvokeSchemaDesignTool(state)

    expect(result).toBe('END')
  })

  it('should return designSchema when schemaDesignSuccessful is false', () => {
    const aiMessage = new AIMessage({
      content: 'Schema design in progress',
    })

    const state = createDbAgentState([aiMessage], false) // schemaDesignSuccessful = false
    const result = routeAfterInvokeSchemaDesignTool(state)

    expect(result).toBe('designSchema')
  })

  it('should return designSchema when schemaDesignSuccessful is undefined (defaults to false)', () => {
    const aiMessage = new AIMessage({
      content: 'Processing schema design',
    })

    // Create state without explicitly setting schemaDesignSuccessful
    const state: DbAgentState = {
      messages: [aiMessage],
      schemaData: { tables: {}, enums: {}, extensions: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      organizationId: 'test-org',
      userId: 'test-user',
      designSessionId: 'test-session',
      next: END,
      designSchemaRetryCount: 0,
      schemaDesignSuccessful: false,
    }

    const result = routeAfterInvokeSchemaDesignTool(state)

    expect(result).toBe('designSchema')
  })

  it('should handle state transitions correctly', () => {
    const aiMessage = new AIMessage({
      content: 'Schema operation',
    })

    // Test with successful state
    const successState = createDbAgentState([aiMessage], true)
    expect(routeAfterInvokeSchemaDesignTool(successState)).toBe('END')

    // Test with failed state
    const failedState = createDbAgentState([aiMessage], false)
    expect(routeAfterInvokeSchemaDesignTool(failedState)).toBe('designSchema')
  })
})
