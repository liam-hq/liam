import type { RunnableConfig } from '@langchain/core/runnables'
import { describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../../repositories'
import { schemaDesignTool } from './schemaDesignTool'

describe('schemaDesignTool', () => {
  const mockRepositories: Repositories = {
    schema: {
      getSchema: vi.fn(),
      getDesignSession: vi.fn(),
      createEmptyPatchVersion: vi.fn(),
      updateVersion: vi.fn(),
      createTimelineItem: vi.fn(),
      updateTimelineItem: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      getArtifact: vi.fn(),
      createValidationQuery: vi.fn(),
      createValidationResults: vi.fn(),
      createWorkflowRun: vi.fn(),
      updateWorkflowRunStatus: vi.fn(),
    },
  }

  const createMockConfig = (
    buildingSchemaVersionId: string,
    repositories: Repositories = mockRepositories,
  ): RunnableConfig => ({
    configurable: {
      buildingSchemaVersionId,
      repositories,
      logger: {
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    },
  })

  it('should successfully update schema version', async () => {
    const mockUpdateVersion = vi.fn().mockResolvedValue({
      success: true,
      newSchema: { tables: [], relations: [] },
    })
    mockRepositories.schema.updateVersion = mockUpdateVersion

    const config = createMockConfig('test-version-id')
    const input = {
      operations: [
        {
          op: 'add',
          path: '/tables/users',
          value: {
            name: 'users',
            columns: [
              { name: 'id', type: 'integer', primaryKey: true },
              { name: 'name', type: 'varchar(255)' },
            ],
          },
        },
      ],
    }

    const result = await schemaDesignTool.invoke(input, config)

    expect(result).toBe('success')
    expect(mockUpdateVersion).toHaveBeenCalledWith({
      buildingSchemaVersionId: 'test-version-id',
      patch: input.operations,
    })
  })

  it('should return error message when update fails', async () => {
    const mockUpdateVersion = vi.fn().mockResolvedValue({
      success: false,
      error: 'Database connection failed',
    })
    mockRepositories.schema.updateVersion = mockUpdateVersion

    const config = createMockConfig('test-version-id')
    const input = {
      operations: [
        {
          op: 'add',
          path: '/tables/users',
          value: {
            name: 'users',
            columns: [{ name: 'id', type: 'integer', primaryKey: true }],
          },
        },
      ],
    }

    const result = await schemaDesignTool.invoke(input, config)

    expect(result).toBe('Database connection failed')
  })

  it('should return unknown error when update fails without error message', async () => {
    const mockUpdateVersion = vi.fn().mockResolvedValue({
      success: false,
      error: null,
    })
    mockRepositories.schema.updateVersion = mockUpdateVersion

    const config = createMockConfig('test-version-id')
    const input = {
      operations: [
        {
          op: 'add',
          path: '/tables/users',
          value: {
            name: 'users',
            columns: [{ name: 'id', type: 'integer', primaryKey: true }],
          },
        },
      ],
    }

    const result = await schemaDesignTool.invoke(input, config)

    expect(result).toBe('Unknown error')
  })

  it('should handle missing configurable object', async () => {
    const config: RunnableConfig = {}
    const input = {
      operations: [],
    }

    const result = await schemaDesignTool.invoke(input, config)

    expect(result).toBe('Missing configurable object in RunnableConfig')
  })

  it('should handle invalid configurable object', async () => {
    const config: RunnableConfig = {
      configurable: {
        // Missing required fields
      },
    }
    const input = {
      operations: [],
    }

    const result = await schemaDesignTool.invoke(input, config)

    expect(result).toContain('Missing repositories in configurable object')
  })

  it('should handle malformed input', async () => {
    const config = createMockConfig('test-version-id')
    const input = {
      operations: 'invalid-operations', // Should be an array
    }

    await expect(schemaDesignTool.invoke(input, config)).rejects.toThrow()
  })

  it('should handle empty operations array', async () => {
    const mockUpdateVersion = vi.fn().mockResolvedValue({
      success: true,
      newSchema: { tables: [], relations: [] },
    })
    mockRepositories.schema.updateVersion = mockUpdateVersion

    const config = createMockConfig('test-version-id')
    const input = {
      operations: [],
    }

    const result = await schemaDesignTool.invoke(input, config)

    expect(result).toBe('success')
    expect(mockUpdateVersion).toHaveBeenCalledWith({
      buildingSchemaVersionId: 'test-version-id',
      patch: [],
    })
  })
})
