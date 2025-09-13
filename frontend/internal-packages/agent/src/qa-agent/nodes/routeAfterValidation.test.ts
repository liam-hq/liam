import { ToolMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { routeAfterValidation } from './routeAfterValidation'

describe('routeAfterValidation', () => {
  const createBaseState = (retryCount = 0, maxRetries = 3): QaAgentState => ({
    messages: [],
    schemaData: {
      tables: {},
      enums: {},
      extensions: {},
    },
    analyzedRequirements: {
      businessRequirement: '',
      functionalRequirements: {},
      nonFunctionalRequirements: {},
    },
    testcases: [],
    designSessionId: 'test-session',
    buildingSchemaId: 'test-schema',
    latestVersionNumber: 1,
    schemaIssues: [],
    next: END,
    retryCount,
    maxRetries,
    lastValidationErrors: '',
  })

  describe('when max retries exceeded', () => {
    it('should route to END when retryCount >= maxRetries', () => {
      const state = createBaseState(3, 3)
      const result = routeAfterValidation(state)
      expect(result).toBe(END)
    })

    it('should route to END when retryCount > maxRetries', () => {
      const state = createBaseState(4, 3)
      const result = routeAfterValidation(state)
      expect(result).toBe(END)
    })
  })

  describe('when validation errors exist', () => {
    it('should route to updateTestcases when tool message contains failed tests', () => {
      const failedToolMessage = new ToolMessage({
        content:
          '1/3 test cases passed, 2 failed\n\n### ❌ **Test Case:** Create user with duplicate email',
        tool_call_id: 'test-tool-call-id',
      })

      const state = createBaseState(1, 3)
      state.messages = [failedToolMessage]

      const result = routeAfterValidation(state)
      expect(result).toBe('updateTestcases')
    })

    it('should route to updateTestcases when tool message contains error indicators', () => {
      const errorToolMessage = new ToolMessage({
        content:
          'Test execution failed with SQL constraint error: column "updated_by" specified more than once',
        tool_call_id: 'test-tool-call-id',
      })

      const state = createBaseState(0, 3)
      state.messages = [errorToolMessage]

      const result = routeAfterValidation(state)
      expect(result).toBe('updateTestcases')
    })
  })

  describe('when all tests pass', () => {
    it('should route to END when all test cases pass', () => {
      const successToolMessage = new ToolMessage({
        content: 'All 5 test cases passed successfully',
        tool_call_id: 'test-tool-call-id',
      })

      const state = createBaseState(1, 3)
      state.messages = [successToolMessage]

      const result = routeAfterValidation(state)
      expect(result).toBe(END)
    })

    it('should route to END when tool message indicates success pattern', () => {
      const successToolMessage = new ToolMessage({
        content: '3/3 test cases passed, 0 failed',
        tool_call_id: 'test-tool-call-id',
      })

      const state = createBaseState(1, 3)
      state.messages = [successToolMessage]

      const result = routeAfterValidation(state)
      expect(result).toBe(END)
    })
  })

  describe('edge cases', () => {
    it('should route to END when no tool message is found', () => {
      const state = createBaseState(1, 3)
      state.messages = [] // No messages

      const result = routeAfterValidation(state)
      expect(result).toBe(END)
    })

    it('should route to END when tool message is empty', () => {
      const emptyToolMessage = new ToolMessage({
        content: '',
        tool_call_id: 'test-tool-call-id',
      })

      const state = createBaseState(1, 3)
      state.messages = [emptyToolMessage]

      const result = routeAfterValidation(state)
      expect(result).toBe(END)
    })

    it('should use the most recent tool message when multiple exist', () => {
      const oldToolMessage = new ToolMessage({
        content: 'All 3 test cases passed successfully',
        tool_call_id: 'old-tool-call-id',
      })

      const recentFailedMessage = new ToolMessage({
        content: '1/3 test cases passed, 2 failed',
        tool_call_id: 'recent-tool-call-id',
      })

      const state = createBaseState(1, 3)
      state.messages = [oldToolMessage, recentFailedMessage]

      const result = routeAfterValidation(state)
      expect(result).toBe('updateTestcases')
    })
  })
})
