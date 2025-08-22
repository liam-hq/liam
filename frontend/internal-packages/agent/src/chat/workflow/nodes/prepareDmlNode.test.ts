import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DMLGenerationAgent } from '../../../langchain/agents/dmlGenerationAgent/agent'
import type { Repositories } from '../../../repositories'
import { InMemoryRepository } from '../../../repositories/InMemoryRepository'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'
import { prepareDmlNode } from './prepareDmlNode'

vi.mock('../../../langchain/agents/dmlGenerationAgent/agent')

describe('prepareDmlNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock implementation
    vi.mocked(DMLGenerationAgent).mockImplementation(() => {
      const agent = {
        generate: vi.fn().mockResolvedValue({
          dmlOperations: [
            {
              useCaseId: 'test-id-1',
              operation_type: 'INSERT',
              sql: "INSERT INTO users (id, name) VALUES (1, 'Test User')",
              description: 'Create test user',
            },
          ],
        }),
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return agent as unknown as DMLGenerationAgent
    })
  })

  const createMockState = (overrides?: Partial<WorkflowState>) => {
    const repositories: Repositories = {
      schema: new InMemoryRepository(),
    }

    return {
      messages: [],
      userInput: 'test',
      schemaData: aSchema({ tables: {} }),
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      organizationId: 'test-org-id',
      userId: 'user-id',
      designSessionId: 'session-id',
      repositories,
      ...overrides,
    }
  }

  it('should return state unchanged when DDL statements are missing', async () => {
    const state = createMockState({
      generatedUsecases: [
        {
          id: 'test-id-1',
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
          dmlOperations: [],
        },
      ],
    })

    const result = await prepareDmlNode(state, {
      configurable: {
        repositories: state.repositories,
        thread_id: 'test-thread',
      },
    })

    expect(result.dmlStatements).toBeUndefined()
  })

  it('should return state unchanged when use cases are missing', async () => {
    const state = createMockState({
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'INT', notNull: true }),
            },
          }),
        },
      }),
    })

    const result = await prepareDmlNode(state, {
      configurable: {
        repositories: state.repositories,
        thread_id: 'test-thread',
      },
    })

    expect(result.dmlStatements).toBeUndefined()
  })

  it('should return state unchanged when use cases array is empty', async () => {
    const state = createMockState({
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'INT', notNull: true }),
            },
          }),
        },
      }),
      generatedUsecases: [],
    })

    const result = await prepareDmlNode(state, {
      configurable: {
        repositories: state.repositories,
        thread_id: 'test-thread',
      },
    })

    expect(result.dmlStatements).toBeUndefined()
  })

  it('should handle empty DML generation result', async () => {
    vi.mocked(DMLGenerationAgent).mockImplementationOnce(() => {
      const agent = {
        generate: vi.fn().mockResolvedValue({
          dmlOperations: [],
        }),
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return agent as unknown as DMLGenerationAgent
    })

    const state = createMockState({
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'INT', notNull: true }),
            },
          }),
        },
      }),
      generatedUsecases: [
        {
          id: 'test-id-1',
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
          dmlOperations: [],
        },
      ],
    })

    const result = await prepareDmlNode(state, {
      configurable: {
        repositories: state.repositories,
        thread_id: 'test-thread',
      },
    })

    expect(result.dmlStatements).toBeUndefined()
  })

  it('should process schema with convertSchemaToText', async () => {
    const state = createMockState({
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'INT', notNull: true }),
              email: aColumn({ name: 'email', type: 'VARCHAR', notNull: true }),
            },
          }),
        },
      }),
      generatedUsecases: [
        {
          id: 'test-id-1',
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
          dmlOperations: [],
        },
      ],
    })

    await prepareDmlNode(state, {
      configurable: {
        repositories: state.repositories,
        thread_id: 'test-thread',
      },
    })

    // Verify convertSchemaToText produces correct output
    const schemaText = convertSchemaToText(state.schemaData)
    expect(schemaText).toContain('Table: users')
    expect(schemaText).toContain('id: INT (not nullable)')
    expect(schemaText).toContain('email: VARCHAR (not nullable)')
  })

  it('should assign generated DML operations to their corresponding usecases', async () => {
    // This test verifies that prepareDmlNode generates DML operations
    // and assigns them to the correct usecase

    const state = createMockState({
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'INT', notNull: true }),
              name: aColumn({ name: 'name', type: 'VARCHAR' }),
            },
          }),
        },
      }),
      generatedUsecases: [
        {
          id: 'test-id-1',
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register',
          title: 'User Registration',
          description: 'Allow users to create new accounts',
          dmlOperations: [],
        },
      ],
    })

    const result = await prepareDmlNode(state, {
      configurable: {
        repositories: state.repositories,
        thread_id: 'test-thread',
      },
    })

    // Verify that DML operations were generated and assigned to the usecase
    expect(result.generatedUsecases).toBeDefined()
    const firstUsecase = result.generatedUsecases?.[0]
    expect(firstUsecase).toBeDefined()
    expect(firstUsecase?.dmlOperations).toBeDefined()
    expect(firstUsecase?.dmlOperations?.length).toBeGreaterThan(0)

    // Verify the DML operation has the correct structure and references the correct usecase
    const dmlOp = firstUsecase?.dmlOperations?.[0]
    expect(dmlOp).toMatchObject({
      useCaseId: 'test-id-1', // References the corresponding usecase
      operation_type: 'INSERT',
      sql: expect.stringContaining('INSERT INTO users'),
      description: expect.any(String),
    })

    // Verify dmlStatements is also generated for other nodes to consume
    expect(result.dmlStatements).toBeDefined()
    expect(result.dmlStatements).toContain('INSERT INTO users')
  })
})
