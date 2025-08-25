import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import type { PmAgentState } from '../pmAgentAnnotations'
import { routeAfterAnalyzeRequirements } from './routeAfterAnalyzeRequirements'

const createPmAgentState = (
  overrides: Partial<PmAgentState> = {},
): PmAgentState => ({
  messages: [],
  designSessionId: 'test-session',
  analyzedRequirementsRetryCount: 0,
  analyzedRequirements: {
    businessRequirement: '',
    functionalRequirements: {},
    nonFunctionalRequirements: {},
  },
  schemaData: { tables: {}, enums: {} },
  ...overrides,
})

describe('routeAfterAnalyzeRequirements', () => {
  describe('when businessRequirement is not empty', () => {
    it('should return END', () => {
      const state = createPmAgentState({
        analyzedRequirements: {
          businessRequirement: 'Test business requirement',
          functionalRequirements: { feature1: ['req1'] },
          nonFunctionalRequirements: { performance: ['req2'] },
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
            name: 'saveRequirementsToArtifactTool',
            args: {},
            id: 'test-id',
          },
        ],
      })

      const state = createPmAgentState({
        messages: [messageWithToolCalls],
        analyzedRequirements: {
          businessRequirement: 'Test business requirement',
          functionalRequirements: { feature1: ['req1'] },
          nonFunctionalRequirements: { performance: ['req2'] },
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
            name: 'saveRequirementsToArtifactTool',
            args: {
              businessRequirement: 'Test',
              functionalRequirements: {},
              nonFunctionalRequirements: {},
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
            name: 'saveRequirementsToArtifactTool',
            args: {},
            id: 'test-id-1',
          },
          {
            name: 'saveRequirementsToArtifactTool',
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

  describe('when no tool calls and businessRequirement is empty', () => {
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
            name: 'saveRequirementsToArtifactTool',
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

    it('should prioritize non-empty businessRequirement over retry count', () => {
      const state = createPmAgentState({
        analyzedRequirements: {
          businessRequirement: 'Test',
          functionalRequirements: {},
          nonFunctionalRequirements: {},
        },
        analyzedRequirementsRetryCount: 10, // Even with high retry count
      })

      const result = routeAfterAnalyzeRequirements(state)
      expect(result).toBe('END')
    })
  })
})
