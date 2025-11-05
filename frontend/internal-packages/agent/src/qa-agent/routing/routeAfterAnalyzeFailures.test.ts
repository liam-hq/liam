import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import { QA_AGENT_MAX_ATTEMPTS } from '../../constants'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { routeAfterAnalyzeFailures } from './routeAfterAnalyzeFailures'

const createMockState = (overrides?: Partial<QaAgentState>): QaAgentState => ({
  messages: [],
  schemaData: { tables: {}, enums: {}, extensions: {} },
  analyzedRequirements: {
    goal: 'Test goal',
    testcases: {},
  },
  designSessionId: 'test-session',
  schemaIssues: [],
  generatedSqls: [],
  failureAnalysis: undefined,
  next: END,
  ...overrides,
})

describe('routeAfterAnalyzeFailures', () => {
  it('should return END when no failureAnalysis', () => {
    const state = createMockState()

    expect(routeAfterAnalyzeFailures(state)).toBe(END)
  })

  it('should return END when no failures', () => {
    const state = createMockState({
      failureAnalysis: {
        failedSqlTestIds: [],
        failedSchemaTestIds: [],
      },
    })

    expect(routeAfterAnalyzeFailures(state)).toBe(END)
  })

  it('should prioritize SQL issues over schema issues', () => {
    const state = createMockState({
      analyzedRequirements: {
        goal: 'Test goal',
        testcases: {
          users: [
            {
              id: 'sql-test',
              title: 'SQL Test',
              type: 'INSERT',
              sql: 'INSERT INTO users (id) VALUES (1)',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'syntax error',
                },
              ],
            },
            {
              id: 'schema-test',
              title: 'Schema Test',
              type: 'INSERT',
              sql: 'INSERT INTO missing_table (id) VALUES (1)',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'table does not exist',
                },
              ],
            },
          ],
        },
      },
      failureAnalysis: {
        failedSqlTestIds: ['sql-test'],
        failedSchemaTestIds: ['schema-test'],
      },
    })

    const expected =
      QA_AGENT_MAX_ATTEMPTS === 1
        ? 'convertToSchemaIssues'
        : 'resetFailedSqlTests'
    expect(routeAfterAnalyzeFailures(state)).toBe(expected)
  })

  it('should route to convertToSchemaIssues when only schema issues', () => {
    const state = createMockState({
      analyzedRequirements: {
        goal: 'Test goal',
        testcases: {
          users: [
            {
              id: 'schema-test',
              title: 'Schema Test',
              type: 'INSERT',
              sql: 'INSERT INTO missing_table (id) VALUES (1)',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'table does not exist',
                },
              ],
            },
          ],
        },
      },
      failureAnalysis: {
        failedSqlTestIds: [],
        failedSchemaTestIds: ['schema-test'],
      },
    })

    // Schema issues are always passed to DB Agent regardless of retry limit
    expect(routeAfterAnalyzeFailures(state)).toBe('convertToSchemaIssues')
  })

  it('should return END when SQL retry limit reached and no schema issues', () => {
    const state = createMockState({
      analyzedRequirements: {
        goal: 'Test goal',
        testcases: {
          users: [
            {
              id: 'sql-test',
              title: 'SQL Test',
              type: 'INSERT',
              sql: 'INSERT INTO users (id) VALUES (1)',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'error 1',
                },
                {
                  executedAt: '2024-01-01T00:01:00Z',
                  success: false,
                  message: 'error 2',
                },
                {
                  executedAt: '2024-01-01T00:02:00Z',
                  success: false,
                  message: 'error 3',
                },
              ],
            },
          ],
        },
      },
      failureAnalysis: {
        failedSqlTestIds: ['sql-test'],
        failedSchemaTestIds: [],
      },
    })

    expect(routeAfterAnalyzeFailures(state)).toBe(END)
  })

  it('should route to schema issues when SQL retry limit reached but schema issues available', () => {
    const state = createMockState({
      analyzedRequirements: {
        goal: 'Test goal',
        testcases: {
          users: [
            {
              id: 'sql-test',
              title: 'SQL Test',
              type: 'INSERT',
              sql: 'INSERT INTO users (id) VALUES (1)',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'error 1',
                },
                {
                  executedAt: '2024-01-01T00:01:00Z',
                  success: false,
                  message: 'error 2',
                },
                {
                  executedAt: '2024-01-01T00:02:00Z',
                  success: false,
                  message: 'error 3',
                },
              ],
            },
            {
              id: 'schema-test',
              title: 'Schema Test',
              type: 'INSERT',
              sql: 'INSERT INTO missing_table (id) VALUES (1)',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'table does not exist',
                },
              ],
            },
          ],
        },
      },
      failureAnalysis: {
        failedSqlTestIds: ['sql-test'],
        failedSchemaTestIds: ['schema-test'],
      },
    })

    // SQL retry limit reached (3 results), but schema issues exist
    // Schema issues are always passed to DB Agent regardless of retry limit
    expect(routeAfterAnalyzeFailures(state)).toBe('convertToSchemaIssues')
  })
})
