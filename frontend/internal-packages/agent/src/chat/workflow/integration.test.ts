import type { RunnableConfig } from '@langchain/core/runnables'
import type { Schema } from '@liam-hq/db-structure'
import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../repositories'
import type { NodeLogger } from '../../utils/nodeLogger'
import { WORKFLOW_RETRY_CONFIG } from './constants'
import { executeDdlNode } from './nodes/executeDdlNode'
import { prepareDmlNode } from './nodes/prepareDmlNode'
import { validateSchemaNode } from './nodes/validateSchemaNode'
import type { WorkflowState } from './types'

// Mock executeQuery for DDL/DML execution
vi.mock('@liam-hq/pglite-server')

// Mock postgresqlSchemaDeparser
vi.mock('@liam-hq/db-structure')

describe('Full Workflow Integration Tests', () => {
  const mockLogger: NodeLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  const createMockRepositories = (): Repositories => {
    const mockRepo = {
      schema: {
        createVersion: vi.fn(),
        createTimelineItem: vi.fn().mockResolvedValue({
          success: true,
          timelineItem: {
            id: 'test-timeline-id',
            content: 'test',
            type: 'assistant',
            user_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            organization_id: 'test-org',
            design_session_id: 'test-session',
            building_schema_version_id: null,
          },
        }),
        getSchema: vi.fn(),
        getDesignSession: vi.fn(),
        updateTimelineItem: vi.fn(),
        createArtifact: vi.fn(),
        updateArtifact: vi.fn(),
        getArtifact: vi.fn(),
      },
    }
    return mockRepo
  }

  const createMockState = (
    overrides?: Partial<WorkflowState>,
  ): WorkflowState => {
    const schema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: true,
              comment: null,
            },
            email: {
              name: 'email',
              type: 'varchar',
              default: null,
              check: null,
              notNull: true,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {
            users_pkey: {
              type: 'PRIMARY KEY',
              name: 'users_pkey',
              columnNames: ['id'],
            },
          },
        },
      },
    }

    return {
      userInput: 'Create a user management system',
      schemaData: schema,
      formattedHistory: '',
      retryCount: {},
      buildingSchemaId: 'test-schema',
      latestVersionNumber: 1,
      userId: 'test-user',
      designSessionId: 'test-session',
      repositories: createMockRepositories(),
      logger: mockLogger,
      generatedUsecases: [
        {
          requirementType: 'functional' as const,
          requirementCategory: 'User Management',
          requirement: 'User account management',
          title: 'User Registration',
          description: 'Allow users to register with email',
        },
        {
          requirementType: 'functional' as const,
          requirementCategory: 'User Management',
          requirement: 'User authentication',
          title: 'User Login',
          description: 'Allow users to login with credentials',
        },
      ],
      ...overrides,
    }
  }

  const createConfig = (): RunnableConfig => ({
    configurable: {
      repositories: createMockRepositories(),
      logger: mockLogger,
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('DDL -> DML -> Validation Flow', () => {
    it('should successfully execute DDL and prepare for DML generation', async () => {
      const state = createMockState()

      // Mock postgresqlSchemaDeparser
      vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
        value:
          'CREATE TABLE users (id INTEGER PRIMARY KEY, email VARCHAR UNIQUE);',
        errors: [],
      })

      // Mock successful DDL execution
      const ddlResults: SqlResult[] = [
        {
          success: true,
          sql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, email VARCHAR UNIQUE);',
          result: { rows: [], columns: [] },
          id: 'ddl-1',
          metadata: {
            executionTime: 10,
            timestamp: new Date().toISOString(),
          },
        },
      ]
      vi.mocked(executeQuery).mockResolvedValueOnce(ddlResults)

      // Execute DDL
      const stateAfterDdl = await executeDdlNode(state, createConfig())
      expect(stateAfterDdl.ddlStatements).toBeDefined()
      expect(stateAfterDdl.ddlStatements).toContain('CREATE TABLE users')
      expect(vi.mocked(executeQuery)).toHaveBeenCalledWith(
        'test-session',
        'CREATE TABLE users (id INTEGER PRIMARY KEY, email VARCHAR UNIQUE);',
      )

      // Prepare DML - currently just returns state as-is
      const stateAfterDml = await prepareDmlNode(stateAfterDdl, createConfig())
      // Since prepareDmlNode is not implemented yet, it just returns the state
      expect(stateAfterDml).toEqual(stateAfterDdl)
    })

    it('should handle DDL failure correctly', async () => {
      const state = createMockState()

      // Mock postgresqlSchemaDeparser
      vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
        value:
          'CREATE TABLE users (id INTEGER PRIMARY KEY, email VARCHAR UNIQUE);',
        errors: [],
      })

      // Mock DDL execution failure
      const ddlResults: SqlResult[] = [
        {
          success: false,
          sql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, email VARCHAR UNIQUE);',
          result: { error: 'Table already exists' },
          id: 'ddl-1',
          metadata: {
            executionTime: 2,
            timestamp: new Date().toISOString(),
          },
        },
      ]
      vi.mocked(executeQuery).mockResolvedValueOnce(ddlResults)

      // Execute DDL (should fail and set up retry)
      const stateAfterDdl = await executeDdlNode(state, createConfig())

      // First failure should trigger retry via designSchemaNode
      expect(stateAfterDdl.shouldRetryWithDesignSchema).toBe(true)
      expect(stateAfterDdl.ddlExecutionFailureReason).toContain(
        'Table already exists',
      )
      expect(stateAfterDdl.retryCount['ddlExecutionRetry']).toBe(1)

      // If we've already retried once, the next failure should be permanent
      const stateWithRetry = {
        ...state,
        retryCount: {
          ddlExecutionRetry: WORKFLOW_RETRY_CONFIG.MAX_DDL_EXECUTION_RETRIES,
        },
      }
      vi.mocked(executeQuery).mockResolvedValueOnce(ddlResults)
      const stateAfterRetry = await executeDdlNode(
        stateWithRetry,
        createConfig(),
      )
      expect(stateAfterRetry.ddlExecutionFailed).toBe(true)
      expect(stateAfterRetry.shouldRetryWithDesignSchema).toBeUndefined()
    })

    it('should handle DML execution with combined DDL/DML', async () => {
      const state = createMockState({
        ddlStatements: 'CREATE TABLE test (id INT);',
        // dmlStatements will be added in a future PR
      })

      // validateSchemaNode is not implemented yet, so it just passes through the state
      const finalState = await validateSchemaNode(state, createConfig())

      // Since validateSchemaNode is not implemented, it returns state unchanged
      expect(finalState.ddlStatements).toBe('CREATE TABLE test (id INT);')
      // DML properties will be added in future PRs
    })

    it('should handle retry logic when DML execution is implemented', async () => {
      const state = createMockState({
        ddlStatements: 'CREATE TABLE users (id INTEGER PRIMARY KEY);',
        // dmlStatements will be added in a future PR
      })

      // validateSchemaNode is not implemented yet
      const stateAfterValidation = await validateSchemaNode(
        state,
        createConfig(),
      )

      // Since validateSchemaNode is not implemented, retry logic is not triggered
      // DML-related properties will be added in future PRs
      // retryCount should remain unchanged
      expect(stateAfterValidation.retryCount).toEqual({})
    })
  })

  describe('Complex Schema Scenarios', () => {
    it('should handle complex schema DDL generation', async () => {
      const complexSchema: Schema = {
        tables: {
          users: {
            name: 'users',
            columns: {
              id: {
                name: 'id',
                type: 'serial',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              email: {
                name: 'email',
                type: 'varchar(255)',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              users_pkey: {
                type: 'PRIMARY KEY',
                name: 'users_pkey',
                columnNames: ['id'],
              },
            },
          },
          products: {
            name: 'products',
            columns: {
              id: {
                name: 'id',
                type: 'serial',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              name: {
                name: 'name',
                type: 'varchar(255)',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              price: {
                name: 'price',
                type: 'decimal(10,2)',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              products_pkey: {
                type: 'PRIMARY KEY',
                name: 'products_pkey',
                columnNames: ['id'],
              },
            },
          },
          orders: {
            name: 'orders',
            columns: {
              id: {
                name: 'id',
                type: 'serial',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              user_id: {
                name: 'user_id',
                type: 'integer',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              total: {
                name: 'total',
                type: 'decimal(10,2)',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              orders_pkey: {
                type: 'PRIMARY KEY',
                name: 'orders_pkey',
                columnNames: ['id'],
              },
              orders_user_fkey: {
                type: 'FOREIGN KEY',
                name: 'orders_user_fkey',
                columnName: 'user_id',
                targetTableName: 'users',
                targetColumnName: 'id',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          },
        },
      }

      const state = createMockState({
        schemaData: complexSchema,
      })

      // Mock complex DDL generation
      const complexDDL = `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  CONSTRAINT orders_user_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);`

      vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
        value: complexDDL,
        errors: [],
      })

      // Mock successful execution
      vi.mocked(executeQuery).mockResolvedValueOnce([
        {
          success: true,
          sql: complexDDL,
          result: { rows: [], columns: [] },
          id: 'ddl-complex',
          metadata: { executionTime: 20, timestamp: new Date().toISOString() },
        },
      ])

      const stateAfterDdl = await executeDdlNode(state, createConfig())

      expect(stateAfterDdl.ddlStatements).toBe(complexDDL)
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Generated DDL for 3 tables'),
      )
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    it('should handle schema with no tables', async () => {
      const emptySchema: Schema = { tables: {} }
      const state = createMockState({ schemaData: emptySchema })

      // Mock empty DDL generation
      vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
        value: '',
        errors: [],
      })

      const stateAfterDdl = await executeDdlNode(state, createConfig())

      // Should have empty DDL statements
      expect(stateAfterDdl.ddlStatements).toBe('')
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('No DDL statements to execute'),
      )
    })

    it('should handle DDL generation errors', async () => {
      const state = createMockState()

      // Mock DDL generation failure
      vi.mocked(postgresqlSchemaDeparser).mockReturnValue({
        value: '',
        errors: [{ message: 'Invalid schema structure' }],
      })

      const stateAfterDdl = await executeDdlNode(state, createConfig())

      expect(stateAfterDdl.ddlStatements).toBe(
        'DDL generation failed due to an unexpected error.',
      )
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining(
          'DDL generation failed: Invalid schema structure',
        ),
      )
    })

    it('should handle non-retryable DML errors when implementation is complete', async () => {
      const state = createMockState({
        // dmlStatements will be added in a future PR
      })

      // validateSchemaNode is not implemented yet
      const stateAfterValidation = await validateSchemaNode(
        state,
        createConfig(),
      )

      // Since validateSchemaNode is not implemented, no error handling occurs
      // DML-related properties will be added in future PRs
      expect(stateAfterValidation).toBeDefined()
    })
  })
})
