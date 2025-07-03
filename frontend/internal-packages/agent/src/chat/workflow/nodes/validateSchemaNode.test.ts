import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from 'vitest'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'
import { validateSchemaNode } from './validateSchemaNode'

// Mock dependencies
vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

vi.mock('../shared/getWorkflowNodeProgress', () => ({
  getWorkflowNodeProgress: vi.fn(),
}))

const createMockSqlResult = (
  overrides: Partial<SqlResult> = {},
): SqlResult => ({
  id: 'mock-id',
  sql: 'SELECT 1',
  success: true,
  result: {},
  metadata: {
    executionTime: 10,
    timestamp: '2024-01-01T00:00:00.000Z',
    affectedRows: 1,
  },
  ...overrides,
})

describe('validateSchemaNode', () => {
  let mockLogger: {
    debug: MockedFunction<
      (message: string, metadata?: Record<string, unknown>) => void
    >
    log: MockedFunction<
      (message: string, metadata?: Record<string, unknown>) => void
    >
    info: MockedFunction<
      (message: string, metadata?: Record<string, unknown>) => void
    >
    warn: MockedFunction<
      (message: string, metadata?: Record<string, unknown>) => void
    >
    error: MockedFunction<
      (message: string, metadata?: Record<string, unknown>) => void
    >
  }
  let mockOnNodeProgress: MockedFunction<
    (nodeName: string, progress: number) => Promise<void>
  >
  let baseState: WorkflowState

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock logger
    mockLogger = {
      debug: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }

    // Mock progress callback
    mockOnNodeProgress = vi.fn()

    // Base state
    baseState = {
      userInput: 'test input',
      formattedHistory: 'test history',
      schemaData: {} as WorkflowState['schemaData'],
      buildingSchemaId: 'schema-123',
      latestVersionNumber: 1,
      userId: 'user-123',
      designSessionId: 'session-123',
      repositories: {} as WorkflowState['repositories'],
      logger: mockLogger,
      retryCount: {},
      dmlStatements: `
        -- Insert a valid user record
        INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');
        
        -- Update user name
        UPDATE users SET name = 'Updated User' WHERE email = 'test@example.com';
      `,
      onNodeProgress: mockOnNodeProgress,
    }

    // Mock utility functions
    vi.mocked(getWorkflowNodeProgress).mockReturnValue(75)
  })

  describe('Success scenarios', () => {
    it('should execute DML statements successfully', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
        createMockSqlResult({
          id: 'result-2',
          sql: "UPDATE users SET name = 'Updated User' WHERE email = 'test@example.com';",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      expect(result).toEqual({
        ...baseState,
        error: undefined,
      })
    })

    it('should call node progress callback with correct parameters', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      await validateSchemaNode(baseState)

      expect(mockOnNodeProgress).toHaveBeenCalledWith('validateSchema', 75)
    })

    it('should work without node progress callback', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const stateWithoutProgress = {
        ...baseState,
        onNodeProgress: undefined,
      }

      const result = await validateSchemaNode(stateWithoutProgress)

      expect(result.error).toBeUndefined()
      expect(mockOnNodeProgress).not.toHaveBeenCalled()
    })

    it('should handle empty DML statements gracefully', async () => {
      const stateWithEmptyDML = {
        ...baseState,
        dmlStatements: '',
      }

      const result = await validateSchemaNode(stateWithEmptyDML)

      expect(result).toEqual({
        ...stateWithEmptyDML,
      })
      expect(vi.mocked(executeQuery)).not.toHaveBeenCalled()
    })

    it('should handle whitespace-only DML statements gracefully', async () => {
      const stateWithWhitespaceDML = {
        ...baseState,
        dmlStatements: '   \n\t   ',
      }

      const result = await validateSchemaNode(stateWithWhitespaceDML)

      expect(result).toEqual({
        ...stateWithWhitespaceDML,
      })
      expect(vi.mocked(executeQuery)).not.toHaveBeenCalled()
    })

    it('should handle undefined DML statements gracefully', async () => {
      const stateWithUndefinedDML = {
        ...baseState,
        dmlStatements: undefined,
      }

      const result = await validateSchemaNode(stateWithUndefinedDML)

      expect(result).toEqual({
        ...stateWithUndefinedDML,
      })
      expect(vi.mocked(executeQuery)).not.toHaveBeenCalled()
    })

    it('should call executeQuery with correct parameters', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      await validateSchemaNode(baseState)

      expect(executeQuery).toHaveBeenCalledWith(
        'session-123',
        baseState.dmlStatements,
      )
    })

    it('should log successful execution', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
        createMockSqlResult({
          id: 'result-2',
          sql: "UPDATE users SET name = 'Updated User' WHERE email = 'test@example.com';",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      await validateSchemaNode(baseState)

      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Started',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Successfully executed 2 DML statements',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Schema validation passed',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Completed',
      )
    })

    it('should filter and count only successful results', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
        createMockSqlResult({
          id: 'result-2',
          sql: "INSERT INTO users (email, name) VALUES ('invalid', 'Test');",
          success: false,
          result: { error: 'Invalid email format' },
        }),
        createMockSqlResult({
          id: 'result-3',
          sql: "UPDATE users SET name = 'Updated User' WHERE email = 'test@example.com';",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      expect(result.error).toBeDefined()
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Started',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Completed with errors',
      )
    })
  })

  describe('Error scenarios', () => {
    it('should handle SQL execution errors', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
        createMockSqlResult({
          id: 'result-2',
          sql: 'INSERT INTO nonexistent_table (id) VALUES (1);',
          success: false,
          result: { error: 'Table does not exist' },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      expect(result.error).toBe(
        'DML validation failed: SQL: INSERT INTO nonexistent_table (id) VALUES (1);, Error: {"error":"Table does not exist"}',
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[validateSchemaNode] DML validation failed: SQL: INSERT INTO nonexistent_table (id) VALUES (1);, Error: {"error":"Table does not exist"}',
      )
    })

    it('should handle multiple SQL execution errors', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: 'INSERT INTO nonexistent_table (id) VALUES (1);',
          success: false,
          result: { error: 'Table does not exist' },
        }),
        createMockSqlResult({
          id: 'result-2',
          sql: "UPDATE users SET invalid_column = 'value';",
          success: false,
          result: { error: 'Column does not exist' },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      expect(result.error).toContain('DML validation failed:')
      expect(result.error).toContain('Table does not exist')
      expect(result.error).toContain('Column does not exist')
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('[validateSchemaNode] DML validation failed:'),
      )
    })

    it('should handle executeQuery throwing an exception', async () => {
      const errorMessage = 'Database connection failed'
      vi.mocked(executeQuery).mockRejectedValue(new Error(errorMessage))

      const result = await validateSchemaNode(baseState)

      expect(result.error).toBe(`DML execution failed: ${errorMessage}`)
      expect(mockLogger.error).toHaveBeenCalledWith(
        `[validateSchemaNode] DML execution failed: ${errorMessage}`,
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Completed with errors',
      )
    })

    it('should handle non-Error exceptions from executeQuery', async () => {
      const errorMessage = 'String error'
      vi.mocked(executeQuery).mockRejectedValue(errorMessage)

      const result = await validateSchemaNode(baseState)

      expect(result.error).toBe(`DML execution failed: ${errorMessage}`)
      expect(mockLogger.error).toHaveBeenCalledWith(
        `[validateSchemaNode] DML execution failed: ${errorMessage}`,
      )
    })

    it('should handle progress callback failure gracefully', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)
      mockOnNodeProgress.mockImplementation(() => {
        throw new Error('Progress callback error')
      })

      // The function should continue despite progress callback error
      await expect(validateSchemaNode(baseState)).rejects.toThrow(
        'Progress callback error',
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle mixed success and error results', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
        createMockSqlResult({
          id: 'result-2',
          sql: "INSERT INTO users (email, name) VALUES ('invalid-email', 'Test');",
          success: false,
          result: { error: 'Invalid email format' },
        }),
        createMockSqlResult({
          id: 'result-3',
          sql: "UPDATE users SET name = 'Updated User' WHERE email = 'test@example.com';",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      expect(result.error).toBeDefined()
      expect(result.error).toContain('DML validation failed:')
      expect(result.error).toContain('invalid-email')
    })

    it('should handle complex SQL statements with special characters', async () => {
      const complexDMLState = {
        ...baseState,
        dmlStatements: `
          -- Insert user with special characters
          INSERT INTO users (email, name, description) VALUES ('test@example.com', 'Test "User"', 'Description with & special chars');
          
          -- Update with complex conditions
          UPDATE users SET name = 'Updated & Modified' WHERE email LIKE '%@example.com';
        `,
      }

      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name, description) VALUES ('test@example.com', 'Test \"User\"', 'Description with & special chars');",
          success: true,
          result: { rowCount: 1 },
        }),
        createMockSqlResult({
          id: 'result-2',
          sql: "UPDATE users SET name = 'Updated & Modified' WHERE email LIKE '%@example.com';",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(complexDMLState)

      expect(result.error).toBeUndefined()
      expect(executeQuery).toHaveBeenCalledWith(
        'session-123',
        complexDMLState.dmlStatements,
      )
    })

    it('should handle empty results array', async () => {
      const mockResults: SqlResult[] = []

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      expect(result.error).toBeUndefined()
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Successfully executed 0 DML statements',
      )
    })

    it('should preserve all state properties when successful', async () => {
      const stateWithAdditionalProps = {
        ...baseState,
        analyzedRequirements: {
          businessRequirement: 'Test requirement',
          functionalRequirements: { auth: ['login', 'logout'] },
          nonFunctionalRequirements: { performance: ['fast'] },
        },
        generatedAnswer: 'Previous answer',
        projectId: 'project-123',
        organizationId: 'org-123',
        generatedUsecases: [
          {
            title: 'Test usecase',
            requirementType: 'functional' as const,
            requirementCategory: 'auth',
            requirement: 'Test requirement',
            description: 'Test description',
          },
        ],
        ddlStatements: 'CREATE TABLE test();',
      }

      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(stateWithAdditionalProps)

      expect(result.analyzedRequirements).toEqual(
        stateWithAdditionalProps.analyzedRequirements,
      )
      expect(result.generatedAnswer).toBe(
        stateWithAdditionalProps.generatedAnswer,
      )
      expect(result.projectId).toBe(stateWithAdditionalProps.projectId)
      expect(result.organizationId).toBe(
        stateWithAdditionalProps.organizationId,
      )
      expect(result.generatedUsecases).toEqual(
        stateWithAdditionalProps.generatedUsecases,
      )
      expect(result.ddlStatements).toBe(stateWithAdditionalProps.ddlStatements)
    })

    it('should handle very large DML statements', async () => {
      const largeDMLStatements = Array.from(
        { length: 1000 },
        (_, i) =>
          `INSERT INTO users (email, name) VALUES ('user${i}@example.com', 'User ${i}');`,
      ).join('\n')

      const stateWithLargeDML = {
        ...baseState,
        dmlStatements: largeDMLStatements,
      }

      const mockResults: SqlResult[] = Array.from({ length: 1000 }, (_, i) =>
        createMockSqlResult({
          id: `result-${i}`,
          sql: `INSERT INTO users (email, name) VALUES ('user${i}@example.com', 'User ${i}');`,
          success: true,
          result: { rowCount: 1 },
        }),
      )

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(stateWithLargeDML)

      expect(result.error).toBeUndefined()
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Successfully executed 1000 DML statements',
      )
    })
  })

  describe('Integration scenarios', () => {
    it('should use getWorkflowNodeProgress correctly', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      await validateSchemaNode(baseState)

      expect(getWorkflowNodeProgress).toHaveBeenCalledWith('validateSchema')
    })

    it('should handle executeQuery with different result formats', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: true,
          result: { rowCount: 1, insertId: 123 },
        }),
        createMockSqlResult({
          id: 'result-2',
          sql: 'SELECT * FROM users;',
          success: true,
          result: { rows: [{ id: 1, email: 'test@example.com' }] },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      expect(result.error).toBeUndefined()
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Successfully executed 2 DML statements',
      )
    })

    it('should handle complex error result formats', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'result-1',
          sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
          success: false,
          result: {
            error: 'Constraint violation',
            details: {
              constraint: 'users_email_unique',
              column: 'email',
              value: 'test@example.com',
            },
          },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      expect(result.error).toContain('Constraint violation')
      expect(result.error).toContain('users_email_unique')
      expect(result.error).toContain('test@example.com')
    })
  })
})
