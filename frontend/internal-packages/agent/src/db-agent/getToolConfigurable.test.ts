import type { RunnableConfig } from '@langchain/core/runnables'
import { describe, expect, it, vi } from 'vitest'
import type { Repositories } from '../repositories'
import { InMemoryRepository } from '../repositories/InMemoryRepository'
import { getToolConfigurable } from './getToolConfigurable'

describe('getToolConfigurable', () => {
  const repositories: Repositories = {
    schema: new InMemoryRepository(),
  }

  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  it('should successfully extract tool configuration', () => {
    const config: RunnableConfig = {
      configurable: {
        buildingSchemaId: 'test-version-id',
        latestVersionNumber: 1,
        designSessionId: 'test-session-id',
        repositories,
        logger: mockLogger,
      },
    }

    const result = getToolConfigurable(config)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.buildingSchemaId).toBe('test-version-id')
      expect(result.value.repositories).toBe(repositories)
    }
  })

  it('should return error when configurable object is missing', () => {
    const config: RunnableConfig = {}

    const result = getToolConfigurable(config)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe(
        'Missing configurable object in RunnableConfig',
      )
    }
  })

  it('should return error when repositories is missing', () => {
    const config: RunnableConfig = {
      configurable: {
        buildingSchemaId: 'test-version-id',
        latestVersionNumber: 1,
        designSessionId: 'test-session-id',
        logger: mockLogger,
        // Missing repositories
      },
    }

    const result = getToolConfigurable(config)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe(
        'Missing repositories in configurable object',
      )
    }
  })

  it('should return error when buildingSchemaId is missing', () => {
    const config: RunnableConfig = {
      configurable: {
        repositories,
        logger: mockLogger,
        latestVersionNumber: 1,
        designSessionId: 'test-session-id',
        // Missing buildingSchemaId
      },
    }

    const result = getToolConfigurable(config)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain(
        'Invalid configurable object in RunnableConfig',
      )
    }
  })

  it('should return error when buildingSchemaId is not a string', () => {
    const config: RunnableConfig = {
      configurable: {
        buildingSchemaId: 123, // Should be string
        latestVersionNumber: 1,
        designSessionId: 'test-session-id',
        repositories,
        logger: mockLogger,
      },
    }

    const result = getToolConfigurable(config)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain(
        'Invalid configurable object in RunnableConfig',
      )
    }
  })

  it('should accept empty string for buildingSchemaId', () => {
    const config: RunnableConfig = {
      configurable: {
        buildingSchemaId: '', // Empty string is valid for v.string()
        latestVersionNumber: 1,
        designSessionId: 'test-session-id',
        repositories,
        logger: mockLogger,
      },
    }

    const result = getToolConfigurable(config)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.buildingSchemaId).toBe('')
    }
  })

  it('should handle additional properties in configurable object', () => {
    const config: RunnableConfig = {
      configurable: {
        buildingSchemaId: 'test-version-id',
        latestVersionNumber: 1,
        designSessionId: 'test-session-id',
        repositories,
        logger: mockLogger,
        additionalProperty: 'should-be-ignored',
      },
    }

    const result = getToolConfigurable(config)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.buildingSchemaId).toBe('test-version-id')
      expect(result.value.repositories).toBe(repositories)
      // Additional properties should not be included in the result
      expect('additionalProperty' in result.value).toBe(false)
    }
  })

  it('should accept string as repositories (truthy check)', () => {
    const config: RunnableConfig = {
      configurable: {
        buildingSchemaId: 'test-version-id',
        latestVersionNumber: 1,
        designSessionId: 'test-session-id',
        repositories: 'not-an-object', // Truthy value passes basic check
        logger: mockLogger,
      },
    }

    const result = getToolConfigurable(config)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.repositories).toBe('not-an-object')
    }
  })

  it('should return error when repositories is null', () => {
    const config: RunnableConfig = {
      configurable: {
        buildingSchemaId: 'test-version-id',
        latestVersionNumber: 1,
        designSessionId: 'test-session-id',
        repositories: null, // Falsy value
        logger: mockLogger,
      },
    }

    const result = getToolConfigurable(config)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe(
        'Missing repositories in configurable object',
      )
    }
  })
})
