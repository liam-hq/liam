import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { analyzeTestFailuresNode } from './analyzeTestFailuresNode'

describe('analyzeTestFailuresNode Integration', () => {
  it('should classify SQL syntax errors as SQL_ISSUE', async () => {
    const state: QaAgentState = {
      messages: [],
      schemaData: { tables: {}, enums: {}, extensions: {} },
      analyzedRequirements: {
        goal: 'Test SQL syntax error',
        testcases: {
          users: [
            {
              id: 'test-1',
              title: 'Insert user with syntax error',
              type: 'INSERT',
              sql: 'INSERT INTO users (id, name) VALUES (1, John)',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'syntax error at or near "John"',
                },
              ],
            },
          ],
        },
      },
      designSessionId: 'test-session',
      schemaIssues: [],
      generatedSqls: [],
      failureAnalysis: undefined,
      next: END,
    }

    const result = await analyzeTestFailuresNode(state)

    expect(result.failureAnalysis).toBeDefined()
    expect(result.failureAnalysis?.failedSqlTestIds).toContain('test-1')
    expect(result.failureAnalysis?.failedSchemaTestIds).not.toContain('test-1')
  })

  it('should classify missing table errors as SCHEMA_ISSUE', async () => {
    const state: QaAgentState = {
      messages: [],
      schemaData: { tables: {}, enums: {}, extensions: {} },
      analyzedRequirements: {
        goal: 'Test missing table',
        testcases: {
          users: [
            {
              id: 'test-1',
              title: 'Query non-existent table',
              type: 'SELECT',
              sql: 'SELECT * FROM missing_table',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'relation "missing_table" does not exist',
                },
              ],
            },
          ],
        },
      },
      designSessionId: 'test-session',
      schemaIssues: [],
      generatedSqls: [],
      failureAnalysis: undefined,
      next: END,
    }

    const result = await analyzeTestFailuresNode(state)

    expect(result.failureAnalysis).toBeDefined()
    expect(result.failureAnalysis?.failedSchemaTestIds).toContain('test-1')
    expect(result.failureAnalysis?.failedSqlTestIds).not.toContain('test-1')
  })

  it('should classify missing column errors as SCHEMA_ISSUE', async () => {
    const state: QaAgentState = {
      messages: [],
      schemaData: { tables: {}, enums: {}, extensions: {} },
      analyzedRequirements: {
        goal: 'Test missing column',
        testcases: {
          users: [
            {
              id: 'test-1',
              title: 'Query non-existent column',
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
      designSessionId: 'test-session',
      schemaIssues: [],
      generatedSqls: [],
      failureAnalysis: undefined,
      next: END,
    }

    const result = await analyzeTestFailuresNode(state)

    expect(result.failureAnalysis).toBeDefined()
    expect(result.failureAnalysis?.failedSchemaTestIds).toContain('test-1')
    expect(result.failureAnalysis?.failedSqlTestIds).not.toContain('test-1')
  })

  it('should handle mixed SQL and schema issues', async () => {
    const state: QaAgentState = {
      messages: [],
      schemaData: { tables: {}, enums: {}, extensions: {} },
      analyzedRequirements: {
        goal: 'Test mixed issues',
        testcases: {
          users: [
            {
              id: 'sql-issue',
              title: 'SQL syntax error',
              type: 'INSERT',
              sql: 'INSERT INTO users VALUES (1, name)',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'syntax error at or near "name"',
                },
              ],
            },
            {
              id: 'schema-issue',
              title: 'Missing table',
              type: 'SELECT',
              sql: 'SELECT * FROM missing_table',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: false,
                  message: 'relation "missing_table" does not exist',
                },
              ],
            },
          ],
        },
      },
      designSessionId: 'test-session',
      schemaIssues: [],
      generatedSqls: [],
      failureAnalysis: undefined,
      next: END,
    }

    const result = await analyzeTestFailuresNode(state)

    expect(result.failureAnalysis).toBeDefined()
    expect(result.failureAnalysis?.failedSqlTestIds).toContain('sql-issue')
    expect(result.failureAnalysis?.failedSchemaTestIds).toContain(
      'schema-issue',
    )
  })

  it('should return empty object when no failures', async () => {
    const state: QaAgentState = {
      messages: [],
      schemaData: { tables: {}, enums: {}, extensions: {} },
      analyzedRequirements: {
        goal: 'Test no failures',
        testcases: {
          users: [
            {
              id: 'test-1',
              title: 'Successful test',
              type: 'SELECT',
              sql: 'SELECT * FROM users',
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: true,
                  message: '',
                },
              ],
            },
          ],
        },
      },
      designSessionId: 'test-session',
      schemaIssues: [],
      generatedSqls: [],
      failureAnalysis: undefined,
      next: END,
    }

    const result = await analyzeTestFailuresNode(state)

    expect(result).toEqual({})
  })
})
