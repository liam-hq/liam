import { describe, expect, test } from 'vitest'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import type { Testcase } from '../types'
import { getUnprocessedRequirements } from './getUnprocessedRequirements'

// Test helper to create mock state
const createMockState = (
  functionalReqs: Record<string, Array<{ id: string; desc: string }>>,
  testcases: Testcase[] = [],
  businessRequirement = 'Test business context',
): QaAgentState => ({
  analyzedRequirements: {
    businessRequirement,
    functionalRequirements: functionalReqs,
  },
  testcases,
  schemaData: { tables: {}, enums: {}, extensions: {} },
  messages: [],
  designSessionId: 'test-session',
  buildingSchemaId: 'test-schema',
  schemaIssues: [],
  next: 'END',
})

// Test helper to create mock testcase
const createMockTestcase = (requirementId: string): Testcase => ({
  id: `testcase-${requirementId}`,
  requirementId,
  requirementType: 'functional',
  requirementCategory: 'user',
  requirement: 'Test requirement',
  title: 'Test title',
  description: 'Test description',
  dmlOperation: {
    operation_type: 'SELECT',
    sql: 'SELECT * FROM users',
    description: 'Test DML operation',
    dml_execution_logs: [],
  },
})

describe('getUnprocessedRequirements', () => {
  test('returns all requirements when no existing testcases', () => {
    const state = createMockState(
      {
        user: [
          { id: 'req-1', desc: 'User login functionality' },
          { id: 'req-2', desc: 'User profile management' },
        ],
      },
      [], // No existing testcases
    )

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([
      {
        type: 'functional',
        category: 'user',
        requirement: 'User login functionality',
        businessContext: 'Test business context',
        requirementId: 'req-1',
      },
      {
        type: 'functional',
        category: 'user',
        requirement: 'User profile management',
        businessContext: 'Test business context',
        requirementId: 'req-2',
      },
    ])
  })

  test('filters out requirements with existing testcases', () => {
    const state = createMockState(
      {
        user: [
          { id: 'req-1', desc: 'User login functionality' },
          { id: 'req-2', desc: 'User profile management' },
          { id: 'req-3', desc: 'User settings' },
        ],
      },
      [
        createMockTestcase('req-1'), // req-1 already has testcase
        createMockTestcase('req-3'), // req-3 already has testcase
      ],
    )

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([
      {
        type: 'functional',
        category: 'user',
        requirement: 'User profile management',
        businessContext: 'Test business context',
        requirementId: 'req-2',
      },
    ])
  })

  test('returns empty array when all requirements are already processed', () => {
    const state = createMockState(
      {
        user: [
          { id: 'req-1', desc: 'User login functionality' },
          { id: 'req-2', desc: 'User profile management' },
        ],
      },
      [createMockTestcase('req-1'), createMockTestcase('req-2')],
    )

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([])
  })

  test('handles mixed processed and unprocessed requirements', () => {
    const state = createMockState(
      {
        user: [{ id: 'req-1', desc: 'User functionality' }],
        admin: [{ id: 'req-2', desc: 'Admin functionality' }],
      },
      [
        createMockTestcase('req-1'), // Only req-1 is processed
      ],
    )

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([
      {
        type: 'functional',
        category: 'admin',
        requirement: 'Admin functionality',
        businessContext: 'Test business context',
        requirementId: 'req-2',
      },
    ])
  })

  test('returns empty array when no requirements exist', () => {
    const state = createMockState({})

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([])
  })
})
