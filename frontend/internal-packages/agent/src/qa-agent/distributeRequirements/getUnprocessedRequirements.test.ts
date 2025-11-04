import { describe, expect, test } from 'vitest'
import type { AnalyzedRequirements } from '../../schemas/analyzedRequirements'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { getUnprocessedRequirements } from './getUnprocessedRequirements'

// Test helper to create mock state
const createMockState = (
  testcases: AnalyzedRequirements['testcases'],
  goal = 'Test session goal',
): QaAgentState => ({
  analyzedRequirements: {
    goal,
    testcases,
  },
  schemaData: { tables: {}, enums: {}, extensions: {} },
  messages: [],
  designSessionId: 'test-session',
  schemaIssues: [],
  generatedSqls: [],
  skipReasons: [],
  failureAnalysis: undefined,
  next: 'END',
})

describe('getUnprocessedRequirements', () => {
  test('returns all testcases when no SQL is present', () => {
    const state = createMockState({
      user: [
        {
          id: '1',
          title: 'User login functionality',
          type: 'SELECT',
          sql: '',
          testResults: [],
        },
        {
          id: '2',
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
        category: 'user',
        testcase: {
          id: '1',
          title: 'User login functionality',
          type: 'SELECT',
          sql: '',
          testResults: [],
        },
      },
      {
        category: 'user',
        testcase: {
          id: '2',
          title: 'User profile management',
          type: 'UPDATE',
          sql: '',
          testResults: [],
        },
      },
    ])
  })

  test('filters out testcases with SQL', () => {
    const state = createMockState({
      user: [
        {
          id: '1',
          title: 'User login functionality',
          type: 'SELECT',
          sql: '',
          testResults: [],
        },
        {
          id: '2',
          title: 'User profile management',
          type: 'UPDATE',
          sql: 'UPDATE users SET name = $1 WHERE id = $2',
          testResults: [],
        },
        {
          id: '3',
          title: 'User settings',
          type: 'SELECT',
          sql: '',
          testResults: [],
        },
      ],
    })

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([
      {
        category: 'user',
        testcase: {
          id: '1',
          title: 'User login functionality',
          type: 'SELECT',
          sql: '',
          testResults: [],
        },
      },
      {
        category: 'user',
        testcase: {
          id: '3',
          title: 'User settings',
          type: 'SELECT',
          sql: '',
          testResults: [],
        },
      },
    ])
  })

  test('returns empty array when all testcases have SQL', () => {
    const state = createMockState({
      user: [
        {
          id: '1',
          title: 'User login functionality',
          type: 'SELECT',
          sql: 'SELECT * FROM users WHERE email = $1',
          testResults: [],
        },
        {
          id: '2',
          title: 'User profile management',
          type: 'UPDATE',
          sql: 'UPDATE users SET name = $1',
          testResults: [],
        },
      ],
    })

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([])
  })

  test('handles multiple categories', () => {
    const state = createMockState({
      user: [
        {
          id: '1',
          title: 'User functionality',
          type: 'SELECT',
          sql: '',
          testResults: [],
        },
      ],
      admin: [
        {
          id: '2',
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
        category: 'user',
        testcase: {
          id: '1',
          title: 'User functionality',
          type: 'SELECT',
          sql: '',
          testResults: [],
        },
      },
      {
        category: 'admin',
        testcase: {
          id: '2',
          title: 'Admin functionality',
          type: 'INSERT',
          sql: '',
          testResults: [],
        },
      },
    ])
  })

  test('returns empty array when no testcases exist', () => {
    const state = createMockState({})

    const result = getUnprocessedRequirements(state)

    expect(result).toEqual([])
  })
})
