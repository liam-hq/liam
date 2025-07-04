import type { Schema } from '@liam-hq/db-structure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkflowState } from '../types'
import { designSchemaNode } from './designSchemaNode'
import { generateDDLNode } from './generateDDLNode'

// Mock the database schema build agent
vi.mock('../../../langchain/agents', () => ({
  DatabaseSchemaBuildAgent: vi.fn().mockImplementation(() => ({
    generate: vi.fn(),
  })),
}))

describe('designSchemaNode -> generateDDLNode integration', () => {
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  const mockRepository = {
    schema: {
      createVersion: vi.fn(),
    },
  }

  const createMockState = (schemaData: Schema): WorkflowState => ({
    userInput: 'Add a users table with id and name fields',
    schemaData,
    logger: mockLogger,
    onNodeProgress: undefined,
    formattedHistory: '',
    retryCount: {},
    buildingSchemaId: 'test-schema',
    latestVersionNumber: 1,
    userId: 'test-user',
    designSessionId: 'test-session',
    repositories: mockRepository as never,
    ddlStatements: '',
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update schemaData and pass it to generateDDLNode', async () => {
    // Mock empty initial schema
    const initialSchema: Schema = { tables: {} }

    // Mock AI agent response with schema changes
    const { DatabaseSchemaBuildAgent } = await import(
      '../../../langchain/agents'
    )
    const mockGenerate = vi.fn().mockResolvedValue({
      message: 'Created users table with id and name fields',
      schemaChanges: [
        {
          op: 'add',
          path: '/tables/users',
          value: {
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
              name: {
                name: 'name',
                type: 'VARCHAR',
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
      ],
    })

    vi.mocked(DatabaseSchemaBuildAgent).mockImplementation(
      () =>
        ({
          generate: mockGenerate,
        }) as never,
    )

    // Mock successful repository operation
    mockRepository.schema.createVersion.mockResolvedValue({
      success: true,
    })

    const initialState = createMockState(initialSchema)

    // Step 1: Design schema (should add users table)
    const afterDesign = await designSchemaNode(initialState)

    // Verify schema was updated in workflow state
    expect(afterDesign.schemaData.tables['users']).toBeDefined()
    expect(afterDesign.schemaData.tables['users']?.name).toBe('users')
    expect(Object.keys(afterDesign.schemaData.tables)).toHaveLength(1)
    expect(afterDesign.error).toBeUndefined()

    // Verify logs
    expect(mockLogger.log).toHaveBeenCalledWith(
      '[designSchemaNode] Current schema has 0 tables',
    )
    expect(mockLogger.log).toHaveBeenCalledWith(
      '[designSchemaNode] Applied 1 schema changes successfully (1 tables)',
    )

    // Step 2: Generate DDL (should now work with updated schema)
    const afterDDL = await generateDDLNode(afterDesign)

    // Verify DDL generation worked
    expect(afterDDL.ddlStatements).toContain('CREATE TABLE "users"')
    expect(afterDDL.ddlStatements).toContain('"id" INTEGER NOT NULL')
    expect(afterDDL.ddlStatements).toContain('"name" VARCHAR NOT NULL')
  })

  it('should handle JSON patch operation errors gracefully', async () => {
    const initialSchema: Schema = { tables: {} }

    // Mock AI agent response with invalid JSON patch operation
    const { DatabaseSchemaBuildAgent } = await import(
      '../../../langchain/agents'
    )
    const mockGenerate = vi.fn().mockResolvedValue({
      message: 'Invalid patch operation',
      schemaChanges: [
        {
          op: 'replace',
          path: '/tables/nonexistent/name', // This path doesn't exist, will cause error
          value: 'newname',
        },
      ],
    })

    vi.mocked(DatabaseSchemaBuildAgent).mockImplementation(
      () =>
        ({
          generate: mockGenerate,
        }) as never,
    )

    // Mock successful repository operation (but patch application will fail)
    mockRepository.schema.createVersion.mockResolvedValue({
      success: true,
    })

    const initialState = createMockState(initialSchema)

    // Step 1: Design schema (should fail during patch application)
    const result = await designSchemaNode(initialState)

    // Verify error handling
    expect(result.error).toBe(
      'Failed to apply schema changes to workflow state',
    )
    expect(result.schemaData).toEqual(initialSchema) // Should remain unchanged
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to apply patch operations to schema data:',
      expect.objectContaining({
        error: expect.any(String),
        operations: expect.any(Array),
      }),
    )
  })

  it('should handle repository errors gracefully', async () => {
    const initialSchema: Schema = { tables: {} }

    // Mock AI agent response
    const { DatabaseSchemaBuildAgent } = await import(
      '../../../langchain/agents'
    )
    const mockGenerate = vi.fn().mockResolvedValue({
      message: 'Repository will fail',
      schemaChanges: [
        {
          op: 'add',
          path: '/tables/test',
          value: {
            name: 'test',
            comment: null,
            columns: {},
            constraints: {},
            indexes: {},
          },
        },
      ],
    })

    vi.mocked(DatabaseSchemaBuildAgent).mockImplementation(
      () =>
        ({
          generate: mockGenerate,
        }) as never,
    )

    // Mock repository failure
    mockRepository.schema.createVersion.mockResolvedValue({
      success: false,
      error: 'Database connection failed',
    })

    const initialState = createMockState(initialSchema)

    // Step 1: Design schema (should fail at repository level)
    const result = await designSchemaNode(initialState)

    // Verify error handling
    expect(result.error).toBe('Database connection failed')
    expect(result.schemaData).toEqual(initialSchema) // Should remain unchanged
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Schema update failed:',
      expect.objectContaining({
        error: 'Database connection failed',
      }),
    )
  })
})
