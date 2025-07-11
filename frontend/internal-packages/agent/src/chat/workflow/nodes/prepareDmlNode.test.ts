import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DMLGenerationAgent } from '../../../langchain/agents/dmlGenerationAgent/agent'
import type { Repositories } from '../../../repositories'
import type { NodeLogger } from '../../../utils/nodeLogger'
import type { WorkflowState } from '../types'
import { prepareDmlNode } from './prepareDmlNode'

vi.mock('../../../langchain/agents/dmlGenerationAgent/agent')

describe('prepareDmlNode', () => {
  const mockLogger: NodeLogger = {
    debug: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock implementation
    vi.mocked(DMLGenerationAgent).mockImplementation(() => {
      const agent = {
        generate: vi.fn().mockResolvedValue({
          dmlStatements: '-- Generated DML statements',
        }),
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return agent as unknown as DMLGenerationAgent
    })
  })

  const createMockRepositories = (): Repositories => ({
    schema: {
      updateTimelineItem: vi.fn(),
      getSchema: vi.fn(),
      getDesignSession: vi.fn(),
      createVersion: vi.fn(),
      createTimelineItem: vi.fn().mockResolvedValue(undefined),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      getArtifact: vi.fn(),
    },
  })

  const createMockState = (
    overrides?: Partial<WorkflowState>,
  ): WorkflowState => {
    return {
      messages: [],
      userInput: 'test',
      schemaData: { tables: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      userId: 'user-id',
      designSessionId: 'session-id',
      retryCount: {},
      artifactMode: 'full' as const,
      ...overrides,
    }
  }

  it('should generate DML statements when DDL and use cases are available', async () => {
    const repositories = createMockRepositories()
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      generatedUsecases: [
        {
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
        },
      ],
    })

    const result = await prepareDmlNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(result.dmlStatements).toBe('-- Generated DML statements')
  })

  it('should return state unchanged when DDL statements are missing', async () => {
    const repositories = createMockRepositories()
    const state = createMockState({
      generatedUsecases: [
        {
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
        },
      ],
    })

    const result = await prepareDmlNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(result.dmlStatements).toBeUndefined()
  })

  it('should return state unchanged when use cases are missing', async () => {
    const repositories = createMockRepositories()
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      generatedUsecases: [],
    })

    const result = await prepareDmlNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(result.dmlStatements).toBeUndefined()
  })

  it('should log input statistics', async () => {
    const repositories = createMockRepositories()
    const state = createMockState({
      ddlStatements:
        'CREATE TABLE users (id INT);\nCREATE TABLE posts (id INT);',
      generatedUsecases: [
        {
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
        },
        {
          requirementType: 'functional',
          requirementCategory: 'Content',
          requirement: 'Users can create posts',
          title: 'Create Posts',
          description: 'Users can publish new posts',
        },
      ],
    })

    await prepareDmlNode(state, {
      configurable: { repositories, logger: mockLogger },
    })
  })

  it('should format use cases by category', async () => {
    const repositories = createMockRepositories()
    const mockGenerate = vi.fn().mockResolvedValue({
      dmlStatements: '-- Generated DML statements',
    })

    vi.mocked(DMLGenerationAgent).mockImplementationOnce(() => {
      const agent = { generate: mockGenerate }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return agent as unknown as DMLGenerationAgent
    })

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      generatedUsecases: [
        {
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
        },
        {
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to login',
          title: 'User Login',
          description: 'Allow users to authenticate',
        },
        {
          requirementType: 'functional',
          requirementCategory: 'Content Management',
          requirement: 'Users can create posts',
          title: 'Create Posts',
          description: 'Users can publish new posts',
        },
      ],
    })

    await prepareDmlNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(mockGenerate).toHaveBeenCalledTimes(1)
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaSQL: 'CREATE TABLE users (id INT);',
        formattedUseCases: expect.stringContaining('User Management:'),
      }),
    )

    // Verify the formatted use cases contain all expected content
    const firstCall = mockGenerate.mock.calls[0]
    if (firstCall?.[0]) {
      const arg = firstCall[0]
      if (
        typeof arg === 'object' &&
        arg !== null &&
        'formattedUseCases' in arg
      ) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const argWithUseCases = arg as { formattedUseCases: unknown }
        const formattedUseCases = String(argWithUseCases.formattedUseCases)
        expect(formattedUseCases).toContain('User Management:')
        expect(formattedUseCases).toContain('Content Management:')
        expect(formattedUseCases).toContain('User Registration')
        expect(formattedUseCases).toContain('User Login')
        expect(formattedUseCases).toContain('Create Posts')
      }
    }
  })

  it('should handle use cases without category', async () => {
    const repositories = createMockRepositories()
    const mockGenerate = vi.fn().mockResolvedValue({
      dmlStatements: '-- Generated DML statements',
    })

    vi.mocked(DMLGenerationAgent).mockImplementationOnce(() => {
      const agent = { generate: mockGenerate }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return agent as unknown as DMLGenerationAgent
    })

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      generatedUsecases: [
        {
          requirementType: 'functional',
          requirementCategory: '',
          requirement: 'Basic functionality',
          title: 'Basic Feature',
          description: 'A basic feature without category',
        },
      ],
    })

    await prepareDmlNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(mockGenerate).toHaveBeenCalledWith({
      schemaSQL: 'CREATE TABLE users (id INT);',
      formattedUseCases: expect.stringContaining('General:'),
    })
  })

  it('should handle empty DML generation result', async () => {
    const repositories = createMockRepositories()
    vi.mocked(DMLGenerationAgent).mockImplementationOnce(() => {
      const agent = {
        generate: vi.fn().mockResolvedValue({
          dmlStatements: '',
        }),
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return agent as unknown as DMLGenerationAgent
    })

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      generatedUsecases: [
        {
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
        },
      ],
    })

    const result = await prepareDmlNode(state, {
      configurable: { repositories, logger: mockLogger },
    })

    expect(result.dmlStatements).toBeUndefined()
  })
})
