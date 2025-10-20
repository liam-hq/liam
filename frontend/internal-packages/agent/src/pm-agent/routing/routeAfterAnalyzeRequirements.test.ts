import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import type { PmAgentState } from '../pmAgentAnnotations'
import { routeAfterAnalyzeRequirements } from './routeAfterAnalyzeRequirements'

const createPmAgentState = (
  overrides: Partial<PmAgentState> = {},
): PmAgentState => ({
  messages: [],
  designSessionId: 'test-session',
  analyzedRequirementsRetryCount: 0,
  analyzedRequirements: {
    goal: '',
    testcases: {},
  },
  schemaData: { tables: {}, enums: {}, extensions: {} },
  artifactSaveSuccessful: false,
  ...overrides,
})

describe('routeAfterAnalyzeRequirements', () => {
  describe('when goal is not empty', () => {
    it('should return END', () => {
      const state = createPmAgentState({
        analyzedRequirements: {
          goal: 'Test business requirement',
          testcases: {
            feature1: [
              {
                id: '1',
                title: 'req1',
                type: 'INSERT',
                sql: '',
                testResults: [],
              },
            ],
          },
        },
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('END')
    })

    it('should return END even if there are tool calls', () => {
      const messageWithToolCalls = new AIMessage({
        content: 'Analysis complete',
        tool_calls: [
          {
            name: 'processAnalyzedRequirementsTool',
            args: {},
            id: 'test-id',
          },
        ],
      })

      const state = createPmAgentState({
        messages: [messageWithToolCalls],
        analyzedRequirements: {
          goal: 'Test business requirement',
          testcases: {
            feature1: [
              {
                id: '1',
                title: 'req1',
                type: 'INSERT',
                sql: '',
                testResults: [],
              },
            ],
          },
        },
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('END')
    })
  })

  describe('when retry limit is exceeded', () => {
    it('should throw WorkflowTerminationError at MAX_ANALYSIS_RETRY_COUNT', () => {
      const state = createPmAgentState({
        analyzedRequirementsRetryCount: 3,
      })

      expect(() => routeAfterAnalyzeRequirements(state)).toThrow(
        WorkflowTerminationError,
      )
      expect(() => routeAfterAnalyzeRequirements(state)).toThrow(
        'Failed to analyze requirements after 3 attempts',
      )
    })

    it('should throw WorkflowTerminationError when count exceeds limit', () => {
      const state = createPmAgentState({
        analyzedRequirementsRetryCount: 5,
      })

      expect(() => routeAfterAnalyzeRequirements(state)).toThrow(
        WorkflowTerminationError,
      )
    })
  })

  describe('when message has tool calls', () => {
    it('should return invokeSaveArtifactTool', () => {
      const messageWithToolCalls = new AIMessage({
        content: 'I need to save requirements',
        tool_calls: [
          {
            name: 'processAnalyzedRequirementsTool',
            args: {
              goal: 'Test',
              testcases: {},
            },
            id: 'test-id',
          },
        ],
      })

      const state = createPmAgentState({
        messages: [messageWithToolCalls],
        analyzedRequirementsRetryCount: 1,
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('invokeSaveArtifactTool')
    })

    it('should handle multiple tool calls', () => {
      const messageWithMultipleToolCalls = new AIMessage({
        content: 'Multiple operations',
        tool_calls: [
          {
            name: 'processAnalyzedRequirementsTool',
            args: {},
            id: 'test-id-1',
          },
          {
            name: 'processAnalyzedRequirementsTool',
            args: {},
            id: 'test-id-2',
          },
        ],
      })

      const state = createPmAgentState({
        messages: [messageWithMultipleToolCalls],
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('invokeSaveArtifactTool')
    })
  })

  describe('when no tool calls and goal is empty', () => {
    it('should return analyzeRequirements for re-analysis', () => {
      const messageWithoutToolCalls = new AIMessage({
        content: 'Unable to analyze requirements',
      })

      const state = createPmAgentState({
        messages: [messageWithoutToolCalls],
        analyzedRequirementsRetryCount: 0,
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('analyzeRequirements')
    })

    it('should return analyzeRequirements with empty tool calls array', () => {
      const messageWithEmptyToolCalls = new AIMessage({
        content: 'No tools needed',
        tool_calls: [],
      })

      const state = createPmAgentState({
        messages: [messageWithEmptyToolCalls],
        analyzedRequirementsRetryCount: 1,
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('analyzeRequirements')
    })

    it('should return analyzeRequirements for HumanMessage', () => {
      const humanMessage = new HumanMessage({
        content: 'User input',
      })

      const state = createPmAgentState({
        messages: [humanMessage],
        analyzedRequirementsRetryCount: 2,
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('analyzeRequirements')
    })
  })

  describe('edge cases', () => {
    it('should handle empty messages array', () => {
      const state = createPmAgentState({
        messages: [],
        analyzedRequirementsRetryCount: 0,
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('analyzeRequirements')
    })

    it('should check only the last message when multiple messages exist', () => {
      const messageWithToolCalls = new AIMessage({
        content: 'First message',
        tool_calls: [
          {
            name: 'processAnalyzedRequirementsTool',
            args: {},
            id: 'test-id',
          },
        ],
      })

      const messageWithoutToolCalls = new AIMessage({
        content: 'Last message without tools',
      })

      const state = createPmAgentState({
        messages: [messageWithToolCalls, messageWithoutToolCalls],
        analyzedRequirementsRetryCount: 1,
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('analyzeRequirements')
    })

    it('should prioritize non-empty goal over retry count', () => {
      const state = createPmAgentState({
        analyzedRequirements: {
          goal: 'Test',
          testcases: {},
        },
        analyzedRequirementsRetryCount: 10, // Even with high retry count
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('END')
    })
  })
})
