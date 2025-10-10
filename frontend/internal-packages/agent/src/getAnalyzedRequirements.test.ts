import type { StateSnapshot } from '@langchain/langgraph'
import type { AnalyzedRequirements } from '@liam-hq/artifact'
import { describe, expect, it } from 'vitest'
import {
  collectAnalyzedRequirementsFromTasks,
  extractAnalyzedRequirementsFromState,
} from './getAnalyzedRequirements'

const createMockStateSnapshot = (
  values: StateSnapshot['values'],
  tasks: StateSnapshot['tasks'] = [],
): StateSnapshot => ({
  values,
  next: [],
  tasks,
  metadata: {
    source: 'input',
    step: 0,
    parents: {},
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  parentConfig: undefined,
  config: { configurable: { thread_id: 'test' } },
})

const createMockTask = (
  state: StateSnapshot,
): StateSnapshot['tasks'][number] => ({
  state,
  id: `task-${Math.random()}`,
  name: 'test-task',
  interrupts: [],
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

  describe('collectAnalyzedRequirementsFromTasks', () => {
    it('should collect analyzedRequirements from tasks with child state', () => {
      const analyzedRequirements = createMockAnalyzedRequirements()
      const childState = createMockStateSnapshot({ analyzedRequirements })

      const state = createMockStateSnapshot({}, [createMockTask(childState)])

      const result = collectAnalyzedRequirementsFromTasks(state)

      expect(result).toEqual(analyzedRequirements)
    })

    it('should recursively collect analyzedRequirements from nested tasks', () => {
      const analyzedRequirements = createMockAnalyzedRequirements()
      const nestedChildState = createMockStateSnapshot({ analyzedRequirements })

      const childState = createMockStateSnapshot({}, [
        createMockTask(nestedChildState),
      ])

      const state = createMockStateSnapshot({}, [createMockTask(childState)])

      const result = collectAnalyzedRequirementsFromTasks(state)

      expect(result).toEqual(analyzedRequirements)
    })

    it('should return the first valid analyzedRequirements found', () => {
      const analyzedRequirements1 = createMockAnalyzedRequirements()
      const analyzedRequirements2 = {
        goal: 'Different goal',
        testcases: {},
      }

      const childState1 = createMockStateSnapshot({
        analyzedRequirements: analyzedRequirements1,
      })
      const childState2 = createMockStateSnapshot({
        analyzedRequirements: analyzedRequirements2,
      })

      const state = createMockStateSnapshot({}, [
        createMockTask(childState1),
        createMockTask(childState2),
      ])

      const result = collectAnalyzedRequirementsFromTasks(state)

      // Should return the first one found
      expect(result).toEqual(analyzedRequirements1)
    })

    it('should return null when tasks have undefined values property', () => {
      const childState = createMockStateSnapshot(undefined)

      const state = createMockStateSnapshot({}, [createMockTask(childState)])

      const result = collectAnalyzedRequirementsFromTasks(state)

      expect(result).toBeNull()
    })

    it('should return null when tasks array is empty', () => {
      const state = createMockStateSnapshot({}, [])

      const result = collectAnalyzedRequirementsFromTasks(state)

      expect(result).toBeNull()
    })

    it('should return null when no analyzedRequirements found in any task', () => {
      const childState1 = createMockStateSnapshot({ messages: [] })
      const childState2 = createMockStateSnapshot({ schemaData: {} })

      const state = createMockStateSnapshot({}, [
        createMockTask(childState1),
        createMockTask(childState2),
      ])

      const result = collectAnalyzedRequirementsFromTasks(state)

      expect(result).toBeNull()
    })
  })
})
