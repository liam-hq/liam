import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../../repositories'
import type {
  DDLExecutionResult,
  DMLExecutionResult,
  WorkflowState,
} from '../types'
import { logDDLExecutionResult, logDMLExecutionResult } from './timelineLogger'

describe('timelineLogger', () => {
  let mockRepositories: Repositories
  let mockState: WorkflowState

  beforeEach(() => {
    mockRepositories = {
      schema: {
        createTimelineItem: vi.fn().mockResolvedValue({
          success: true,
          timelineItem: { id: 'test-timeline-id' },
        }),
        getSchema: vi.fn(),
        getDesignSession: vi.fn(),
        createVersion: vi.fn(),
        updateTimelineItem: vi.fn(),
        createArtifact: vi.fn(),
        updateArtifact: vi.fn(),
        getArtifact: vi.fn(),
      },
    }

    mockState = {
      messages: [],
      userInput: 'test input',
      schemaData: { tables: {} },
      retryCount: {},
      buildingSchemaId: 'test-schema-id',
      latestVersionNumber: 1,
      userId: 'test-user-id',
      designSessionId: 'test-session-id',
    }
  })

  describe('logDDLExecutionResult', () => {
    it('should create timeline item with DDL execution result', async () => {
      const ddlResult: DDLExecutionResult = {
        statements: ['CREATE TABLE users (id SERIAL PRIMARY KEY);'],
        results: [
          {
            sql: 'CREATE TABLE users (id SERIAL PRIMARY KEY);',
            result: { command: 'CREATE', rowCount: 0 },
            success: true,
            id: 'test-id',
            metadata: {
              executionTime: 100,
              timestamp: '2025-01-01T00:00:00Z',
            },
          },
        ],
        executionTime: 100,
        success: true,
      }

      await logDDLExecutionResult(mockState, mockRepositories, ddlResult)

      expect(mockRepositories.schema.createTimelineItem).toHaveBeenCalledWith({
        designSessionId: 'test-session-id',
        content: JSON.stringify(ddlResult),
        type: 'ddl_execution_result',
        executionResult: ddlResult,
      })
    })

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(mockRepositories.schema.createTimelineItem).mockRejectedValue(
        new Error('Database error'),
      )

      const ddlResult: DDLExecutionResult = {
        statements: ['CREATE TABLE users (id SERIAL PRIMARY KEY);'],
        results: [],
        executionTime: 100,
        success: true,
      }

      await logDDLExecutionResult(mockState, mockRepositories, ddlResult)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create DDL execution result timeline item:',
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('logDMLExecutionResult', () => {
    it('should create timeline item with DML execution result', async () => {
      const dmlResult: DMLExecutionResult = {
        usecase: 'Create user account',
        statements: ["INSERT INTO users (name) VALUES ('John Doe');"],
        results: [
          {
            sql: "INSERT INTO users (name) VALUES ('John Doe');",
            result: { command: 'INSERT', rowCount: 1 },
            success: true,
            id: 'test-id',
            metadata: {
              executionTime: 50,
              timestamp: '2025-01-01T00:00:00Z',
              affectedRows: 1,
            },
          },
        ],
        executionTime: 50,
        success: true,
      }

      await logDMLExecutionResult(mockState, mockRepositories, dmlResult)

      expect(mockRepositories.schema.createTimelineItem).toHaveBeenCalledWith({
        designSessionId: 'test-session-id',
        content: JSON.stringify(dmlResult),
        type: 'dml_execution_result',
        executionResult: dmlResult,
      })
    })

    it('should handle DML execution with errors', async () => {
      const dmlResult: DMLExecutionResult = {
        usecase: 'Invalid operation',
        statements: ['INVALID SQL STATEMENT;'],
        results: [
          {
            sql: 'INVALID SQL STATEMENT;',
            result: { error: 'syntax error at or near "INVALID"' },
            success: false,
            id: 'test-id',
            metadata: {
              executionTime: 10,
              timestamp: '2025-01-01T00:00:00Z',
            },
          },
        ],
        executionTime: 10,
        success: false,
        errors: [
          'SQL: INVALID SQL STATEMENT;, Error: "syntax error at or near \\"INVALID\\""',
        ],
      }

      await logDMLExecutionResult(mockState, mockRepositories, dmlResult)

      expect(mockRepositories.schema.createTimelineItem).toHaveBeenCalledWith({
        designSessionId: 'test-session-id',
        content: JSON.stringify(dmlResult),
        type: 'dml_execution_result',
        executionResult: dmlResult,
      })
    })
  })
})
