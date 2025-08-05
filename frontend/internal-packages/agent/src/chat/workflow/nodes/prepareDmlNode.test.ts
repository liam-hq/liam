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
      schemaData: { tables: {}, enums: {} },
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
      configurable: { repositories: state.repositories },
    })

    expect(result.dmlStatements).toBeUndefined()
    expect(result.dmlOperations).toBeUndefined()
  })

  it('should return state unchanged when use cases are missing', async () => {
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
    })

    const result = await prepareDmlNode(state, {
      configurable: { repositories: state.repositories },
    })

    expect(result.dmlStatements).toBeUndefined()
    expect(result.dmlOperations).toBeUndefined()
  })

  it('should return state unchanged when use cases array is empty', async () => {
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
      generatedUsecases: [],
    })

    const result = await prepareDmlNode(state, {
      configurable: { repositories: state.repositories },
    })

    expect(result.dmlStatements).toBeUndefined()
    expect(result.dmlOperations).toBeUndefined()
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
      ddlStatements: 'CREATE TABLE users (id INT);',
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
      configurable: { repositories: state.repositories },
    })

    expect(result.dmlStatements).toBeUndefined()
    expect(result.dmlOperations).toBeUndefined()
  })

  it('should process schema with convertSchemaToText', async () => {
    const state = createMockState({
      ddlStatements: 'CREATE TABLE users (id INT);',
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
        enums: {},
      },
    })

    await prepareDmlNode(state, {
      configurable: { repositories: state.repositories },
    })

    // Verify convertSchemaToText produces correct output
    const schemaText = convertSchemaToText(state.schemaData)
    expect(schemaText).toContain('Table: users')
    expect(schemaText).toContain('id: INT (not nullable)')
    expect(schemaText).toContain('email: VARCHAR (not nullable)')
  })
})
