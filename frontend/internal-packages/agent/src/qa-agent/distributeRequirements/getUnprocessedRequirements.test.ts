import { describe, expect, test } from 'vitest'
import type { TestCase } from '../../utils/schema/analyzedRequirements'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { getUnprocessedRequirements } from './getUnprocessedRequirements'

// Test helper to create mock state
const createMockState = (
  testcases: Record<string, TestCase[]>,
  goal = 'Test business context',
): QaAgentState => ({
  analyzedRequirements: {
    goal,
    testcases,
  },
  schemaData: { tables: {}, enums: {}, extensions: {} },
  messages: [],
  designSessionId: 'test-session',
  buildingSchemaId: 'test-schema',
  schemaIssues: [],
  next: 'END',
})

describe('getUnprocessedRequirements', () => {
  test('returns all test cases without SQL', () => {
    const state = createMockState({
      user: [
        {
          title: 'User login functionality',
          type: 'SELECT',
          sql: '',
          testResults: [],
        },
        {
          title: 'User profile management',
          type: 'UPDATE',
          sql: '',
          testResults: [],
        },
      ],
    })

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([
      {
        type: 'functional',
        category: 'user',
        requirement: 'User login functionality',
        businessContext: 'Test business context',
        requirementId: 'User login functionality',
      },
      {
        type: 'functional',
        category: 'user',
        requirement: 'User profile management',
        businessContext: 'Test business context',
        requirementId: 'User profile management',
      },
    ])
  })

  test('filters out test cases that already have SQL', () => {
    const state = createMockState({
      user: [
        {
          title: 'User login functionality',
          type: 'SELECT',
          sql: 'SELECT * FROM users WHERE email = $1',
          testResults: [],
        },
        {
          title: 'User profile management',
          type: 'UPDATE',
          sql: '',
          testResults: [],
        },
        {
          title: 'User settings',
          type: 'SELECT',
          sql: 'SELECT * FROM settings',
          testResults: [],
        },
      ],
    })

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([
      {
        type: 'functional',
        category: 'user',
        requirement: 'User profile management',
        businessContext: 'Test business context',
        requirementId: 'User profile management',
      },
    ])
  })

  test('returns empty array when all test cases have SQL', () => {
    const state = createMockState({
      user: [
        {
          title: 'User login functionality',
          type: 'SELECT',
          sql: 'SELECT * FROM users',
          testResults: [],
        },
        {
          title: 'User profile management',
          type: 'UPDATE',
          sql: 'UPDATE users SET ...',
          testResults: [],
        },
      ],
    })

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([])
  })

  test('handles mixed categories with and without SQL', () => {
    const state = createMockState({
      user: [
        {
          title: 'User functionality',
          type: 'SELECT',
          sql: 'SELECT * FROM users',
          testResults: [],
        },
      ],
      admin: [
        {
          title: 'Admin functionality',
          type: 'INSERT',
          sql: '',
          testResults: [],
        },
      ],
    })

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([
      {
        type: 'functional',
        category: 'admin',
        requirement: 'Admin functionality',
        businessContext: 'Test business context',
        requirementId: 'Admin functionality',
      },
    ])
  })

  test('returns empty array when no test cases exist', () => {
    const state = createMockState({})

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([])
  })
})
