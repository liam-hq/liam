import type { StateSnapshot } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import { extractAnalyzedRequirementsFromState } from './getAnalyzedRequirements'
import type { AnalyzedRequirements } from './schemas/analyzedRequirements'

const createMockStateSnapshot = (
  values: StateSnapshot['values'],
): StateSnapshot => ({
  values,
  next: [],
  tasks: [],
  metadata: {
    source: 'input',
    step: 0,
    parents: {},
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  parentConfig: undefined,
  config: { configurable: { thread_id: 'test' } },
})

const createMockAnalyzedRequirements = (): AnalyzedRequirements => ({
  goal: 'Test goal',
  testcases: {
    'Functional Requirements': [
      {
        id: 'test-1',
        title: 'Test case 1',
        type: 'INSERT',
        sql: '',
        testResults: [],
      },
    ],
  },
})

describe('getAnalyzedRequirements', () => {
  describe('extractAnalyzedRequirementsFromState', () => {
    it('should extract analyzedRequirements from state with valid structure', () => {
      const analyzedRequirements = createMockAnalyzedRequirements()
      const state = createMockStateSnapshot({ analyzedRequirements })

      const result = extractAnalyzedRequirementsFromState(state)

      expect(result).toEqual(analyzedRequirements)
    })

    it('should return null when state.values is undefined', () => {
      const state = createMockStateSnapshot(undefined)

      const result = extractAnalyzedRequirementsFromState(state)

      expect(result).toBeNull()
    })

    it('should return null when analyzedRequirements is not in state', () => {
      const state = createMockStateSnapshot({ messages: [] })

      const result = extractAnalyzedRequirementsFromState(state)

      expect(result).toBeNull()
    })

    it('should return null when analyzedRequirements has invalid structure (missing goal)', () => {
      const state = createMockStateSnapshot({
        analyzedRequirements: { testcases: {} },
      })

      const result = extractAnalyzedRequirementsFromState(state)

      expect(result).toBeNull()
    })

    it('should return null when analyzedRequirements has invalid structure (missing testcases)', () => {
      const state = createMockStateSnapshot({
        analyzedRequirements: { goal: 'Test' },
      })

      const result = extractAnalyzedRequirementsFromState(state)

      expect(result).toBeNull()
    })

    it('should return null when analyzedRequirements is not an object', () => {
      const state = createMockStateSnapshot({
        analyzedRequirements: 'invalid',
      })

      const result = extractAnalyzedRequirementsFromState(state)

      expect(result).toBeNull()
    })
  })
})
