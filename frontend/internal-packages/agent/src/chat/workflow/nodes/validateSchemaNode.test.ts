import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NodeLogger } from '../../../utils/nodeLogger'
import type { WorkflowState } from '../types'
import { validateSchemaNode } from './validateSchemaNode'

vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
}))

vi.mock('../shared/getWorkflowNodeProgress', () => ({
  getWorkflowNodeProgress: vi.fn(() => 80),
}))

describe('validateSchemaNode', () => {
  let mockExecuteQuery: ReturnType<typeof vi.fn>
  let mockGetWorkflowNodeProgress: ReturnType<typeof vi.fn>
  let mockLogger: NodeLogger
  let mockOnNodeProgress: ReturnType<typeof vi.fn>

  const createMockSqlResult = (
    overrides: Partial<SqlResult> = {},
  ): SqlResult => ({
    sql: "INSERT INTO users (name, email) VALUES ('test', 'test@example.com');",
    result: { rows: [], columns: [] },
    success: true,
    id: 'test-id',
    metadata: {
      executionTime: 10,
      timestamp: '2025-06-30T07:42:16.000Z',
      affectedRows: 1,
    },
    ...overrides,
  })

  const createMockLogger = (): NodeLogger => ({
    debug: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })

  const createBaseState = (
    overrides: Partial<WorkflowState> = {},
  ): WorkflowState => ({
    userInput: 'Test input',
    formattedHistory: 'No previous conversation.',
    schemaData: { tables: {} },
    buildingSchemaId: 'test-building-schema-id',
    latestVersionNumber: 1,
    userId: 'test-user-id',
    designSessionId: 'test-design-session-id',
    repositories: {
      schema: {
        getSchema: vi.fn(),
        getDesignSession: vi.fn(),
        createVersion: vi.fn(),
        createTimelineItem: vi.fn(),
        updateTimelineItem: vi.fn(),
      },
    },
    logger: mockLogger,
    retryCount: {},
    dmlStatements:
      "INSERT INTO users (name, email) VALUES ('test', 'test@example.com');",
    ...overrides,
  })

  beforeEach(async () => {
    vi.clearAllMocks()

    const pgliteModule = await import('@liam-hq/pglite-server')
    const progressModule = await import('../shared/getWorkflowNodeProgress')

    mockExecuteQuery = vi.mocked(pgliteModule.executeQuery)
    mockGetWorkflowNodeProgress = vi.mocked(
      progressModule.getWorkflowNodeProgress,
    )
    mockLogger = createMockLogger()
    mockOnNodeProgress = vi.fn()

    mockGetWorkflowNodeProgress.mockReturnValue(80)
  })

  describe('Success scenarios', () => {
    it('should execute DML statements successfully and return updated state', async () => {
      const mockResults = [createMockSqlResult()]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const state = createBaseState({
        dmlStatements:
          "INSERT INTO users (name, email) VALUES ('test', 'test@example.com');",
      })

      const result = await validateSchemaNode(state)

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'test-design-session-id',
        "INSERT INTO users (name, email) VALUES ('test', 'test@example.com');",
      )
      expect(result.error).toBeUndefined()
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Started',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Successfully executed 1 DML statements',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Schema validation passed',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Completed',
      )
    })

    it('should call progress callback with correct parameters when provided', async () => {
      const mockResults = [createMockSqlResult()]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const state = createBaseState({
        onNodeProgress: mockOnNodeProgress,
      })

      await validateSchemaNode(state)

      expect(mockOnNodeProgress).toHaveBeenCalledWith('validateSchema', 80)
      expect(mockGetWorkflowNodeProgress).toHaveBeenCalledWith('validateSchema')
    })

    it('should handle multiple successful DML statements', async () => {
      const mockResults = [
        createMockSqlResult({
          sql: "INSERT INTO users (name) VALUES ('user1');",
        }),
        createMockSqlResult({
          sql: "INSERT INTO users (name) VALUES ('user2');",
        }),
        createMockSqlResult({
          sql: "INSERT INTO users (name) VALUES ('user3');",
        }),
      ]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const state = createBaseState({
        dmlStatements:
          "INSERT INTO users (name) VALUES ('user1'); INSERT INTO users (name) VALUES ('user2'); INSERT INTO users (name) VALUES ('user3');",
      })

      const result = await validateSchemaNode(state)

      expect(result.error).toBeUndefined()
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Successfully executed 3 DML statements',
      )
    })

    it('should clear existing error on successful execution', async () => {
      const mockResults = [createMockSqlResult()]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const state = createBaseState({
        error: 'Previous error',
      })

      const result = await validateSchemaNode(state)

      expect(result.error).toBeUndefined()
    })
  })

  describe('Early return scenarios', () => {
    it('should return early when dmlStatements is undefined', async () => {
      const state = createBaseState({
        dmlStatements: undefined,
      })

      const result = await validateSchemaNode(state)

      expect(mockExecuteQuery).not.toHaveBeenCalled()
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Started',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] No DML statements to execute',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Completed',
      )
      expect(result).toEqual(state)
    })

    it('should return early when dmlStatements is empty string', async () => {
      const state = createBaseState({
        dmlStatements: '',
      })

      await validateSchemaNode(state)

      expect(mockExecuteQuery).not.toHaveBeenCalled()
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] No DML statements to execute',
      )
    })

    it('should return early when dmlStatements is only whitespace', async () => {
      const state = createBaseState({
        dmlStatements: '   \n\t  ',
      })

      await validateSchemaNode(state)

      expect(mockExecuteQuery).not.toHaveBeenCalled()
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] No DML statements to execute',
      )
    })

    it('should still call progress callback even when returning early', async () => {
      const state = createBaseState({
        dmlStatements: undefined,
        onNodeProgress: mockOnNodeProgress,
      })

      await validateSchemaNode(state)

      expect(mockOnNodeProgress).toHaveBeenCalledWith('validateSchema', 80)
    })
  })

  describe('SQL execution error scenarios', () => {
    it('should handle single failed SQL statement', async () => {
      const mockResults = [
        createMockSqlResult({
          success: false,
          sql: "INSERT INTO nonexistent_table (name) VALUES ('test');",
          result: { error: 'Table does not exist' },
        }),
      ]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const state = createBaseState({
        dmlStatements: "INSERT INTO nonexistent_table (name) VALUES ('test');",
      })

      const result = await validateSchemaNode(state)

      expect(result.error).toBe(
        'DML validation failed: SQL: INSERT INTO nonexistent_table (name) VALUES (\'test\');, Error: {"error":"Table does not exist"}',
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[validateSchemaNode] DML validation failed: SQL: INSERT INTO nonexistent_table (name) VALUES (\'test\');, Error: {"error":"Table does not exist"}',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Completed with errors',
      )
    })

    it('should handle multiple failed SQL statements', async () => {
      const mockResults = [
        createMockSqlResult({
          success: false,
          sql: "INSERT INTO table1 (name) VALUES ('test');",
          result: { error: 'Table1 does not exist' },
        }),
        createMockSqlResult({
          success: true,
          sql: "INSERT INTO users (name) VALUES ('test');",
        }),
        createMockSqlResult({
          success: false,
          sql: "INSERT INTO table2 (name) VALUES ('test');",
          result: { error: 'Table2 does not exist' },
        }),
      ]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const state = createBaseState()

      const result = await validateSchemaNode(state)

      expect(result.error).toBe(
        'DML validation failed: SQL: INSERT INTO table1 (name) VALUES (\'test\');, Error: {"error":"Table1 does not exist"}; SQL: INSERT INTO table2 (name) VALUES (\'test\');, Error: {"error":"Table2 does not exist"}',
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('DML validation failed'),
      )
    })

    it('should handle mixed success and failure results', async () => {
      const mockResults = [
        createMockSqlResult({ success: true }),
        createMockSqlResult({
          success: false,
          sql: 'INVALID SQL',
          result: { error: 'Syntax error' },
        }),
      ]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const state = createBaseState()

      const result = await validateSchemaNode(state)

      expect(result.error).toContain('DML validation failed')
      expect(result.error).toContain('INVALID SQL')
      expect(result.error).toContain('Syntax error')
    })
  })

  describe('Exception handling scenarios', () => {
    it('should handle executeQuery throwing an Error object', async () => {
      const error = new Error('Database connection failed')
      mockExecuteQuery.mockRejectedValue(error)

      const state = createBaseState()

      const result = await validateSchemaNode(state)

      expect(result.error).toBe(
        'DML execution failed: Database connection failed',
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[validateSchemaNode] DML execution failed: Database connection failed',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Completed with errors',
      )
    })

    it('should handle executeQuery throwing a string', async () => {
      mockExecuteQuery.mockRejectedValue('Connection timeout')

      const state = createBaseState()

      const result = await validateSchemaNode(state)

      expect(result.error).toBe('DML execution failed: Connection timeout')
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[validateSchemaNode] DML execution failed: Connection timeout',
      )
    })

    it('should handle executeQuery throwing non-Error object', async () => {
      mockExecuteQuery.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      })

      const state = createBaseState()

      const result = await validateSchemaNode(state)

      expect(result.error).toBe('DML execution failed: [object Object]')
    })

    it('should handle executeQuery throwing null or undefined', async () => {
      mockExecuteQuery.mockRejectedValue(null)

      const state = createBaseState()

      const result = await validateSchemaNode(state)

      expect(result.error).toBe('DML execution failed: null')
    })
  })

  describe('Progress callback scenarios', () => {
    it('should not call progress callback when onNodeProgress is undefined', async () => {
      const mockResults = [createMockSqlResult()]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const state = createBaseState({
        onNodeProgress: undefined,
      })

      await validateSchemaNode(state)

      expect(mockGetWorkflowNodeProgress).not.toHaveBeenCalled()
    })

    it('should handle progress callback throwing an error', async () => {
      const mockResults = [createMockSqlResult()]
      mockExecuteQuery.mockResolvedValue(mockResults)
      mockOnNodeProgress.mockRejectedValue(
        new Error('Progress callback failed'),
      )

      const state = createBaseState({
        onNodeProgress: mockOnNodeProgress,
      })

      await expect(validateSchemaNode(state)).rejects.toThrow(
        'Progress callback failed',
      )
    })
  })

  describe('Logger integration', () => {
    it('should log all expected messages for successful execution', async () => {
      const mockResults = [createMockSqlResult()]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const state = createBaseState()

      await validateSchemaNode(state)

      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Started',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Successfully executed 1 DML statements',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Schema validation passed',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Completed',
      )
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should log error messages for failed execution', async () => {
      const mockResults = [
        createMockSqlResult({
          success: false,
          sql: 'INVALID SQL',
          result: { error: 'Syntax error' },
        }),
      ]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const state = createBaseState()

      await validateSchemaNode(state)

      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Started',
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('[validateSchemaNode] DML validation failed'),
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Completed with errors',
      )
    })

    it('should log error messages for exceptions', async () => {
      mockExecuteQuery.mockRejectedValue(new Error('Connection failed'))

      const state = createBaseState()

      await validateSchemaNode(state)

      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Started',
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[validateSchemaNode] DML execution failed: Connection failed',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] Completed with errors',
      )
    })
  })

  describe('State preservation', () => {
    it('should preserve all state properties except error on success', async () => {
      const mockResults = [createMockSqlResult()]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const initialState = createBaseState({
        userInput: 'Test user input',
        formattedHistory: 'Test history',
        projectId: 'test-project-123',
        analyzedRequirements: {
          businessRequirement: 'Test BRD',
          functionalRequirements: { Test: ['Requirement'] },
          nonFunctionalRequirements: { Performance: ['Fast'] },
        },
      })

      const result = await validateSchemaNode(initialState)

      expect(result.userInput).toBe(initialState.userInput)
      expect(result.formattedHistory).toBe(initialState.formattedHistory)
      expect(result.projectId).toBe(initialState.projectId)
      expect(result.analyzedRequirements).toEqual(
        initialState.analyzedRequirements,
      )
      expect(result.schemaData).toEqual(initialState.schemaData)
      expect(result.repositories).toBe(initialState.repositories)
      expect(result.logger).toBe(initialState.logger)
      expect(result.error).toBeUndefined()
    })

    it('should preserve all state properties and set error on failure', async () => {
      const mockResults = [
        createMockSqlResult({
          success: false,
          result: { error: 'Test error' },
        }),
      ]
      mockExecuteQuery.mockResolvedValue(mockResults)

      const initialState = createBaseState({
        userInput: 'Test user input',
        finalResponse: 'Previous response',
      })

      const result = await validateSchemaNode(initialState)

      expect(result.userInput).toBe(initialState.userInput)
      expect(result.finalResponse).toBe(initialState.finalResponse)
      expect(result.error).toContain('DML validation failed')
    })
  })
})
