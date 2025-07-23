import { err, ok } from 'neverthrow'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DMLOperation } from '../../../langchain/agents/dmlGenerationAgent/agent'
import { DMLGenerationAgent } from '../../../langchain/agents/dmlGenerationAgent/agent'
import type { Repositories } from '../../../repositories'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
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
        generateDMLForUsecase: vi.fn().mockResolvedValue(
          ok([
            {
              sql: 'SELECT 1',
              operationType: 'SELECT' as const,
              purpose: 'Test query',
              expectedOutcome: 'Returns 1',
              order: 1,
            },
          ]),
        ),
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return agent as unknown as DMLGenerationAgent
    })
  })

  const createMockState = (overrides?: Partial<WorkflowState>) => {
    const repositories: Repositories = {
      schema: {
        updateTimelineItem: vi.fn(),
        getSchema: vi.fn(),
        getDesignSession: vi.fn(),
        createEmptyPatchVersion: vi.fn(),
        updateVersion: vi.fn(),
        createTimelineItem: vi.fn().mockResolvedValue(undefined),
        createArtifact: vi.fn(),
        updateArtifact: vi.fn(),
        getArtifact: vi.fn(),
        createValidationQuery: vi.fn(),
        createValidationResults: vi.fn(),
        createWorkflowRun: vi.fn(),
        updateWorkflowRunStatus: vi.fn(),
      },
    }

    return {
      messages: [],
      userInput: 'test',
      schemaData: { tables: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      organizationId: 'test-org-id',
      userId: 'user-id',
      designSessionId: 'session-id',
      retryCount: {},
      repositories,
      ...overrides,
    }
  }

  it('should return state unchanged when DDL statements are missing', async () => {
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
      configurable: { repositories: state.repositories, logger: mockLogger },
    })

    expect(result.dmlStatements).toBeUndefined()
  })

  it('should return state unchanged when use cases are missing', async () => {
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
    })

    const result = await prepareDmlNode(state, {
      configurable: { repositories: state.repositories, logger: mockLogger },
    })

    expect(result.dmlStatements).toBeUndefined()
  })

  it('should return state unchanged when use cases array is empty', async () => {
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      generatedUsecases: [],
    })

    const result = await prepareDmlNode(state, {
      configurable: { repositories: state.repositories, logger: mockLogger },
    })

    expect(result.dmlStatements).toBeUndefined()
  })

  it('should handle empty DML generation result', async () => {
    vi.mocked(DMLGenerationAgent).mockImplementationOnce(() => {
      const agent = {
        generate: vi.fn().mockResolvedValue({
          dmlStatements: '',
        }),
        generateDMLForUsecase: vi.fn().mockResolvedValue(
          ok([
            {
              sql: 'SELECT 1',
              operationType: 'SELECT' as const,
              purpose: 'Test query',
              expectedOutcome: 'Returns 1',
              order: 1,
            },
          ]),
        ),
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
      configurable: { repositories: state.repositories, logger: mockLogger },
    })

    expect(result.dmlStatements).toBeUndefined()
  })

  it('should process schema with convertSchemaToText', async () => {
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
      schemaData: {
        tables: {
          users: {
            name: 'users',
            comment: null,
            columns: {
              id: {
                name: 'id',
                type: 'INT',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              email: {
                name: 'email',
                type: 'VARCHAR',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
            },
            constraints: {},
            indexes: {},
          },
        },
      },
    })

    await prepareDmlNode(state, {
      configurable: { repositories: state.repositories, logger: mockLogger },
    })

    // Verify convertSchemaToText produces correct output
    const schemaText = convertSchemaToText(state.schemaData)
    expect(schemaText).toContain('Table: users')
    expect(schemaText).toContain('id: INT (not nullable)')
    expect(schemaText).toContain('email: VARCHAR (not nullable)')
  })

  it('should generate DML operations for each use case', async () => {
    const mockOperations: DMLOperation[] = [
      {
        sql: "INSERT INTO users (id, email) VALUES (1, 'test@example.com')",
        operationType: 'INSERT',
        purpose: 'Create test user',
        expectedOutcome: 'User created successfully',
        order: 1,
      },
      {
        sql: "SELECT * FROM users WHERE email = 'test@example.com'",
        operationType: 'SELECT',
        purpose: 'Verify user exists',
        expectedOutcome: 'Should return the created user',
        order: 2,
      },
    ]

    vi.mocked(DMLGenerationAgent).mockImplementationOnce(() => {
      const agent = {
        generate: vi.fn().mockResolvedValue({
          dmlStatements: '-- Generated DML for use case',
        }),
        generateDMLForUsecase: vi.fn().mockResolvedValue(ok(mockOperations)),
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return agent as unknown as DMLGenerationAgent
    })

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT, email VARCHAR);',
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
      configurable: { repositories: state.repositories, logger: mockLogger },
    })

    expect(result.dmlOperations).toBeDefined()
    expect(result.dmlOperations).toHaveLength(1)
    expect(result.dmlOperations?.[0]?.usecase).toEqual(
      state.generatedUsecases?.[0],
    )
    expect(result.dmlOperations?.[0]?.operations).toEqual(mockOperations)
  })

  it('should handle multiple use cases', async () => {
    const mockOperations1: DMLOperation[] = [
      {
        sql: "INSERT INTO users (id, email) VALUES (1, 'user1@test.com')",
        operationType: 'INSERT',
        purpose: 'Create test user 1',
        expectedOutcome: 'User 1 created',
        order: 1,
      },
    ]

    const mockOperations2: DMLOperation[] = [
      {
        sql: "UPDATE users SET email = 'updated@test.com' WHERE id = 1",
        operationType: 'UPDATE',
        purpose: 'Update user email',
        expectedOutcome: 'Email updated',
        order: 1,
      },
    ]

    vi.mocked(DMLGenerationAgent).mockImplementationOnce(() => {
      const agent = {
        generate: vi.fn().mockResolvedValue({
          dmlStatements: '-- Generated DML for multiple use cases',
        }),
        generateDMLForUsecase: vi
          .fn()
          .mockResolvedValueOnce(ok(mockOperations1))
          .mockResolvedValueOnce(ok(mockOperations2)),
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return agent as unknown as DMLGenerationAgent
    })

    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT, email VARCHAR);',
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
          requirement: 'Users should be able to update profile',
          title: 'Profile Update',
          description: 'Allow users to update their information',
        },
      ],
    })

    const result = await prepareDmlNode(state, {
      configurable: { repositories: state.repositories, logger: mockLogger },
    })

    expect(result.dmlOperations).toHaveLength(2)
    expect(result.dmlOperations?.[0]?.operations).toEqual(mockOperations1)
    expect(result.dmlOperations?.[1]?.operations).toEqual(mockOperations2)
  })

  it('should handle errors from generateDMLForUsecase', async () => {
    vi.mocked(DMLGenerationAgent).mockImplementationOnce(() => {
      const agent = {
        generate: vi.fn().mockResolvedValue({
          dmlStatements: '-- Generated DML',
        }),
        generateDMLForUsecase: vi
          .fn()
          .mockResolvedValue(err(new Error('Failed to generate DML'))),
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
      configurable: { repositories: state.repositories, logger: mockLogger },
    })

    expect(result.error).toBeDefined()
    expect(result.error?.message).toContain('Failed to generate DML')
  })
})
