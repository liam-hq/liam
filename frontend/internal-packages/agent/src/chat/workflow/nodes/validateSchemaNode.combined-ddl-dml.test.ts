import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
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
import type { WorkflowState } from '../types'
import { validateSchemaNode } from './validateSchemaNode'

// Mock dependencies
vi.mock('@liam-hq/db-structure', () => ({
  postgresqlSchemaDeparser: vi.fn(),
}))

vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn(),
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

describe('validateSchemaNode - Combined DDL and DML Execution', () => {
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

    // Base state
    baseState = {
      userInput: 'test input',
      formattedHistory: 'test history',
      schemaData: {
        tables: {
          users: {
            name: 'users',
            comment: null,
            columns: {
              id: {
                name: 'id',
                type: 'INTEGER',
                default: null,
                check: null,
                notNull: true,
                comment: null,
              },
              email: {
                name: 'email',
                type: 'VARCHAR(255)',
                default: null,
                check: null,
                notNull: true,
                comment: null,
              },
            },
            constraints: {},
            indexes: {},
          },
        },
      },
      buildingSchemaId: 'schema-123',
      latestVersionNumber: 1,
      userId: 'user-123',
      designSessionId: 'session-123',
      repositories: {
        schema: {
          getSchema: vi.fn(),
          getDesignSession: vi.fn(),
          createVersion: vi.fn(),
          createTimelineItem: vi.fn(),
          updateTimelineItem: vi.fn(),
          createArtifact: vi.fn(),
          updateArtifact: vi.fn(),
          getArtifact: vi.fn(),
        },
      } satisfies WorkflowState['repositories'] as WorkflowState['repositories'],
      logger: mockLogger,
      retryCount: {},
      dmlStatements: `
        -- Insert a valid user record
        INSERT INTO users (email) VALUES ('test@example.com');
        
        -- Update user
        UPDATE users SET email = 'updated@example.com' WHERE email = 'test@example.com';
      `,
    }

    // Mock DDL generation
    vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
      value: `CREATE TABLE "users" (
  "id" INTEGER NOT NULL,
  "email" VARCHAR(255) NOT NULL
);`,
      errors: [],
    })
  })

  describe('Combined DDL and DML execution', () => {
    it('should execute DDL before DML in a single executeQuery call', async () => {
      const expectedCombinedSQL = `CREATE TABLE "users" (
  "id" INTEGER NOT NULL,
  "email" VARCHAR(255) NOT NULL
);

-- Insert a valid user record
        INSERT INTO users (email) VALUES ('test@example.com');
        
        -- Update user
        UPDATE users SET email = 'updated@example.com' WHERE email = 'test@example.com';`

      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'ddl-result-1',
          sql: 'CREATE TABLE "users" (...)',
          success: true,
          result: { message: 'Table created' },
        }),
        createMockSqlResult({
          id: 'dml-result-1',
          sql: "INSERT INTO users (email) VALUES ('test@example.com');",
          success: true,
          result: { rowCount: 1 },
        }),
        createMockSqlResult({
          id: 'dml-result-2',
          sql: "UPDATE users SET email = 'updated@example.com' WHERE email = 'test@example.com';",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      // Verify that executeQuery was called once with combined DDL + DML
      expect(executeQuery).toHaveBeenCalledTimes(1)
      expect(executeQuery).toHaveBeenCalledWith(
        'session-123',
        expectedCombinedSQL,
      )

      // Verify that DDL was generated from schema
      expect(postgresqlSchemaDeparser).toHaveBeenCalledWith(
        baseState.schemaData,
      )

      // Verify successful result
      expect(result.error).toBeUndefined()
      expect(result.ddlStatements).toBe(`CREATE TABLE "users" (
  "id" INTEGER NOT NULL,
  "email" VARCHAR(255) NOT NULL
);`)
    })

    it('should handle DDL generation errors', async () => {
      // Mock DDL generation failure
      vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
        value: '',
        errors: [{ message: 'Invalid schema structure' }],
      })

      const result = await validateSchemaNode(baseState)

      // Verify that executeQuery was not called when DDL generation fails
      expect(executeQuery).not.toHaveBeenCalled()

      // Verify error state
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toContain('DDL generation failed')
      expect(result.error?.message).toContain('Invalid schema structure')
    })

    it('should handle empty DDL gracefully and execute only DML', async () => {
      // Mock empty DDL generation
      vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
        value: '',
        errors: [],
      })

      const expectedDMLOnly = baseState.dmlStatements

      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'dml-result-1',
          sql: "INSERT INTO users (email) VALUES ('test@example.com');",
          success: true,
          result: { rowCount: 1 },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      // Verify that executeQuery was called with DML only
      expect(executeQuery).toHaveBeenCalledWith('session-123', expectedDMLOnly)

      // Verify successful result
      expect(result.error).toBeUndefined()
      expect(result.ddlStatements).toBe('')
    })

    it('should handle empty DML gracefully and execute only DDL', async () => {
      const stateWithoutDML = {
        ...baseState,
        dmlStatements: '',
      }

      const expectedDDLOnly = `CREATE TABLE "users" (
  "id" INTEGER NOT NULL,
  "email" VARCHAR(255) NOT NULL
);`

      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'ddl-result-1',
          sql: 'CREATE TABLE "users" (...)',
          success: true,
          result: { message: 'Table created' },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(stateWithoutDML)

      // Verify that executeQuery was called with DDL only
      expect(executeQuery).toHaveBeenCalledWith('session-123', expectedDDLOnly)

      // Verify successful result
      expect(result.error).toBeUndefined()
      expect(result.ddlStatements).toBe(expectedDDLOnly)
    })

    it('should skip execution when both DDL and DML are empty', async () => {
      const stateWithoutDMLOrDDL = {
        ...baseState,
        dmlStatements: '',
      }

      // Mock empty DDL generation
      vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
        value: '',
        errors: [],
      })

      const result = await validateSchemaNode(stateWithoutDMLOrDDL)

      // Verify that executeQuery was not called
      expect(executeQuery).not.toHaveBeenCalled()

      // Verify that function completes without errors
      expect(result.error).toBeUndefined()
      expect(result.ddlStatements).toBe('')
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[validateSchemaNode] No DDL or DML statements to execute',
      )
    })

    it('should preserve DDL statements in the result state', async () => {
      const expectedDDL = `CREATE TABLE "users" (
  "id" INTEGER NOT NULL,
  "email" VARCHAR(255) NOT NULL
);`

      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'combined-result',
          sql: 'Combined DDL and DML',
          success: true,
          result: { message: 'Success' },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      // Verify that DDL statements are preserved in the result
      expect(result.ddlStatements).toBe(expectedDDL)
      expect(result.error).toBeUndefined()
    })

    it('should handle combined DDL and DML execution errors', async () => {
      const mockResults: SqlResult[] = [
        createMockSqlResult({
          id: 'ddl-result-1',
          sql: 'CREATE TABLE "users" (...)',
          success: true,
          result: { message: 'Table created' },
        }),
        createMockSqlResult({
          id: 'dml-result-1',
          sql: "INSERT INTO users (email) VALUES ('test@example.com');",
          success: false,
          result: { error: 'Constraint violation' },
        }),
      ]

      vi.mocked(executeQuery).mockResolvedValue(mockResults)

      const result = await validateSchemaNode(baseState)

      // Verify error handling
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toContain('DML validation failed')
      expect(result.error?.message).toContain('Constraint violation')
    })
  })
})
