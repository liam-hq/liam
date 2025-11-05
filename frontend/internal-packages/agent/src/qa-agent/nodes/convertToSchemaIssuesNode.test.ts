import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { convertToSchemaIssuesNode } from './convertToSchemaIssuesNode'

// Test helper to create mock state
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

describe('convertToSchemaIssuesNode', () => {
  it('should convert failed schema test IDs to schema issues', () => {
    const state = createMockState({
      analyzedRequirements: {
        goal: 'Test goal',
        testcases: {
          users: [
            {
              id: 'test-1',
              title: 'Test missing table',
              type: 'INSERT',
              sql: 'INSERT INTO missing_table (id) VALUES (1)',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'relation "missing_table" does not exist',
                },
              ],
            },
          ],
          accounts: [
            {
              id: 'test-2',
              title: 'Test missing column',
              type: 'SELECT',
              sql: 'SELECT missing_column FROM users',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'column "missing_column" does not exist',
                },
              ],
            },
          ],
        },
      },
      failureAnalysis: {
        failedSqlTestIds: [],
        failedSchemaTestIds: ['test-1', 'test-2'],
      },
    })

    const result = convertToSchemaIssuesNode(state)

    expect(result.schemaIssues).toHaveLength(2)
    expect(result.schemaIssues?.[0]).toEqual({
      testcaseId: 'test-1',
      description:
        'Test "Test missing table" failed with schema issue: relation "missing_table" does not exist',
    })
    expect(result.schemaIssues?.[1]).toEqual({
      testcaseId: 'test-2',
      description:
        'Test "Test missing column" failed with schema issue: column "missing_column" does not exist',
    })
    expect(result.next).toBe(END)
  })

  it('should return empty object when no schema issues', () => {
    const state = createMockState({
      failureAnalysis: {
        failedSqlTestIds: ['test-1'],
        failedSchemaTestIds: [],
      },
    })

    const result = convertToSchemaIssuesNode(state)

    expect(result).toEqual({})
  })

  it('should return empty object when no failureAnalysis', () => {
    const state = createMockState()

    const result = convertToSchemaIssuesNode(state)

    expect(result).toEqual({})
  })

  it('should handle test case not found', () => {
    const state = createMockState({
      failureAnalysis: {
        failedSqlTestIds: [],
        failedSchemaTestIds: ['non-existent-test'],
      },
    })

    const result = convertToSchemaIssuesNode(state)

    expect(result.schemaIssues).toEqual([])
    expect(result.next).toBe(END)
  })
})
