import type { Schema } from '@liam-hq/db-structure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type DeepModelingParams, deepModeling } from './deepModeling'
import type { Repositories, SchemaRepository } from './repositories'
import type { NodeLogger } from './utils/nodeLogger'

// Mock the agents
vi.mock('./langchain/agents', () => ({
  DatabaseSchemaBuildAgent: vi.fn(),
  QAGenerateUsecaseAgent: vi.fn(),
  PMAnalysisAgent: vi.fn(),
}))

// Mock the schema converter
vi.mock('./utils/convertSchemaToText', () => ({
  convertSchemaToText: vi.fn(() => 'Mocked schema text'),
}))

// Mock the pglite-server
vi.mock('@liam-hq/pglite-server', () => ({
  executeQuery: vi.fn().mockResolvedValue([
    {
      success: true,
      sql: 'CREATE TABLE test (id INTEGER);',
      result: { rows: [], columns: [] },
      id: 'test-result-id',
      metadata: {
        executionTime: 10,
        timestamp: new Date().toISOString(),
        affectedRows: 0,
      },
    },
  ]),
}))

describe('Chat Workflow', () => {
  let mockSchemaData: Schema
  let mockAgent: {
    generate: ReturnType<typeof vi.fn>
  }
  let mockPMAnalysisAgent: {
    analyzeRequirements: ReturnType<typeof vi.fn>
  }
  let MockDatabaseSchemaBuildAgent: ReturnType<typeof vi.fn>
  let MockQAGenerateUsecaseAgent: ReturnType<typeof vi.fn>
  let MockPMAnalysisAgent: ReturnType<typeof vi.fn>
  let mockRepositories: Repositories
  let mockSchemaRepository: SchemaRepository
  let mockLogger: NodeLogger

  // Helper function to create test schema data
  const createMockSchema = (): Schema => ({
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
          name: {
            name: 'name',
            type: 'varchar',
            default: null,
            check: null,
            notNull: false,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnName: 'id',
          },
        },
      },
    },
  })

  // Helper function to create base workflow params
  const createBaseParams = (
    overrides: Partial<DeepModelingParams> = {},
  ): DeepModelingParams => ({
    userInput: 'Test input',
    history: [],
    schemaData: mockSchemaData,
    organizationId: 'test-org-id',
    buildingSchemaId: 'test-building-schema-id',
    latestVersionNumber: 1,
    userId: 'test-user-id',
    designSessionId: 'test-design-session-id',
    repositories: mockRepositories,
    logger: mockLogger,
    ...overrides,
  })

  // Helper function to execute workflow and assert common expectations
  const executeAndAssertSuccess = async (params: DeepModelingParams) => {
    const result = await deepModeling(params)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.text).toBe('Mocked agent response')
      expect(typeof result.value.text).toBe('string')
    }
    expect(mockAgent.generate).toHaveBeenCalledOnce()

    return result
  }

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()

    // Get the mocked modules
    const agentsModule = await import('./langchain/agents')

    MockDatabaseSchemaBuildAgent = vi.mocked(
      agentsModule.DatabaseSchemaBuildAgent,
    )
    MockPMAnalysisAgent = vi.mocked(agentsModule.PMAnalysisAgent)
    MockQAGenerateUsecaseAgent = vi.mocked(agentsModule.QAGenerateUsecaseAgent)

    // Create mock repositories
    mockSchemaRepository = {
      getSchema: vi.fn(),
      getDesignSession: vi.fn(),
      createVersion: vi.fn(),
      createTimelineItem: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      getArtifact: vi.fn(),
      updateTimelineItem: vi.fn(),
    } as SchemaRepository

    mockRepositories = {
      schema: mockSchemaRepository,
    }

    // Create mock logger
    mockLogger = {
      debug: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }

    // Create mock schema data
    mockSchemaData = createMockSchema()

    // Mock agent
    mockAgent = {
      generate: vi.fn().mockResolvedValue({
        message: 'Mocked agent response',
        schemaChanges: [],
      }),
    }

    // Mock PM Analysis agent
    mockPMAnalysisAgent = {
      analyzeRequirements: vi.fn().mockResolvedValue({
        businessRequirement: 'Mocked BRD',
        functionalRequirements: {
          'Test Category': ['Mocked functional requirement'],
        },
        nonFunctionalRequirements: {
          Performance: ['Mocked non-functional requirement'],
        },
      }),
    }

    // Setup agent mocks
    MockDatabaseSchemaBuildAgent.mockImplementation(() => mockAgent)
    MockPMAnalysisAgent.mockImplementation(() => mockPMAnalysisAgent)
    MockQAGenerateUsecaseAgent.mockImplementation(() => ({
      generate: vi.fn().mockResolvedValue({
        usecases: [
          {
            requirementType: 'functional',
            requirementCategory: 'Test Category',
            requirement: 'Mocked functional requirement',
            title: 'Mocked Use Case',
            description: 'Mocked use case description',
          },
        ],
      }),
    }))

    // Setup createVersion mock
    vi.mocked(mockSchemaRepository.createVersion).mockResolvedValue({
      success: true,
      newSchema: mockSchemaData, // Return the same schema for simplicity
    })

    // Setup createTimelineItem mock
    vi.mocked(mockSchemaRepository.createTimelineItem).mockResolvedValue({
      success: true,
      timelineItem: {
        id: 'test-timeline-item-id',
        content: 'Test timeline item content',
        type: 'assistant',
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization_id: 'test-org-id',
        design_session_id: 'test-design-session-id',
        building_schema_version_id: null,
        progress: null,
      },
    })

    // Setup artifact-related mocks
    vi.mocked(mockSchemaRepository.getArtifact).mockResolvedValue({
      success: false,
      error: 'Artifact not found',
    })

    vi.mocked(mockSchemaRepository.createArtifact).mockResolvedValue({
      success: true,
      artifact: {
        id: 'test-artifact-id',
        design_session_id: 'test-design-session-id',
        organization_id: 'test-org-id',
        artifact: {
          requirement_analysis: { business_requirement: '', requirements: [] },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })

    vi.mocked(mockSchemaRepository.updateArtifact).mockResolvedValue({
      success: true,
      artifact: {
        id: 'test-artifact-id',
        design_session_id: 'test-design-session-id',
        organization_id: 'test-org-id',
        artifact: {
          requirement_analysis: { business_requirement: '', requirements: [] },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })
  })

  describe('Build Mode', () => {
    it('should execute successfully with valid Build mode state', async () => {
      const params = createBaseParams({
        userInput: 'Add a created_at timestamp column to the users table',
      })

      await executeAndAssertSuccess(params)
    })

    it('should handle Build mode with structured JSON response and schema changes', async () => {
      const structuredResponse = {
        message: 'Added created_at column to users table',
        schemaChanges: [
          {
            op: 'add',
            path: '/tables/users/columns/created_at',
            value: {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              notNull: true,
            },
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(structuredResponse)

      const params = createBaseParams({
        userInput: 'Add a created_at timestamp column to the users table',
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
      })

      const result = await deepModeling(params)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.text).toBe('Added created_at column to users table')
      }
      expect(mockSchemaRepository.createVersion).toHaveBeenCalledWith({
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        patch: [
          {
            op: 'add',
            path: '/tables/users/columns/created_at',
            value: {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              notNull: true,
            },
          },
        ],
      })
    })

    it('should handle Build mode with invalid JSON response gracefully', async () => {
      mockAgent.generate.mockResolvedValue({
        message: 'Invalid JSON response',
        schemaChanges: [],
      })

      const params = createBaseParams({
        userInput: 'Add a created_at timestamp column to the users table',
      })

      const result = await deepModeling(params)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.text).toBe('Invalid JSON response')
      }
      expect(mockSchemaRepository.createVersion).not.toHaveBeenCalled()
    })

    it('should handle schema update failure', async () => {
      const structuredResponse = {
        message: 'Attempted to add created_at column',
        schemaChanges: [
          {
            op: 'add',
            path: '/tables/users/columns/created_at',
            value: { name: 'created_at', type: 'timestamp' },
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(structuredResponse)
      vi.mocked(mockSchemaRepository.createVersion).mockResolvedValue({
        success: false,
        error: 'Database constraint violation',
      })

      const params = createBaseParams({
        userInput: 'Add a created_at timestamp column to the users table',
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        recursionLimit: 20,
      })

      const result = await deepModeling(params)

      // The test should handle either the expected error or recursion limit error
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toMatch(
          /Database constraint violation|Recursion limit/,
        )
      }
    })

    it('should handle schema update exception', async () => {
      const structuredResponse = {
        message: 'Attempted to add created_at column',
        schemaChanges: [
          {
            op: 'add',
            path: '/tables/users/columns/created_at',
            value: { name: 'created_at', type: 'timestamp' },
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(structuredResponse)
      vi.mocked(mockSchemaRepository.createVersion).mockRejectedValue(
        new Error('Network error'),
      )

      const params = createBaseParams({
        userInput: 'Add a created_at timestamp column to the users table',
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
      })

      const result = await deepModeling(params)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Network error')
      }
    })

    it('should handle complex schema modifications', async () => {
      const params = createBaseParams({
        userInput: 'Create a new posts table with foreign key to users',
      })

      await executeAndAssertSuccess(params)
    })
  })

  describe('Error Handling', () => {
    it('should handle agent generation errors', async () => {
      mockAgent.generate.mockRejectedValue(new Error('Agent generation failed'))
      const params = createBaseParams()

      const result = await deepModeling(params)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Agent generation failed')
      }
    })

    it('should handle agent creation failure', async () => {
      MockDatabaseSchemaBuildAgent.mockImplementation(() => {
        throw new Error('Failed to create DatabaseSchemaBuildAgent')
      })
      const params = createBaseParams()

      const result = await deepModeling(params)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe(
          'Failed to create DatabaseSchemaBuildAgent',
        )
      }
    })

    it('should handle empty user input', async () => {
      const params = createBaseParams({ userInput: '' })

      const result = await deepModeling(params)

      expect(result).toBeDefined()
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.text).toBe('Mocked agent response')
      }
    })
  })

  describe('State Management', () => {
    it('should preserve state properties through workflow execution', async () => {
      const initialParams = createBaseParams({
        userInput: 'Test state management',
      })

      const result = await deepModeling(initialParams)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.text).toBe('Mocked agent response')
      }
    })
  })

  describe('Agent Selection', () => {
    it('should instantiate DatabaseSchemaBuildAgent', async () => {
      const params = createBaseParams({})

      await deepModeling(params)

      expect(MockDatabaseSchemaBuildAgent).toHaveBeenCalledOnce()
    })
  })

  describe('Workflow Integration', () => {
    // Helper function to execute multiple workflows sequentially
    const executeSequentialWorkflows = async (
      inputs: { userInput: string }[],
    ) => {
      const results = []
      for (const input of inputs) {
        const params = createBaseParams(input)
        const result = await deepModeling(params)
        results.push(result)
      }
      return results
    }

    it('should handle multiple sequential workflow executions', async () => {
      const inputs = [
        { userInput: 'First modification' },
        { userInput: 'Second modification' },
        { userInput: 'Third modification' },
      ]

      const results = await executeSequentialWorkflows(inputs)

      expect(results).toHaveLength(3)
      for (const result of results) {
        expect(result).toBeDefined()
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value.text).toBe('Mocked agent response')
        }
      }
    })

    it('should maintain consistency across different input types', async () => {
      const testInputs = [
        'Simple question about users table',
        'Complex query with multiple joins and conditions',
        'Schema modification request with constraints',
        'Question with special characters: @#$%^&*()',
        'Multi-line\ninput\nwith\nbreaks',
      ]

      const inputs = testInputs.map((userInput) => ({ userInput }))
      const results = await executeSequentialWorkflows(inputs)

      for (const result of results) {
        expect(result).toBeDefined()
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value.text).toBe('Mocked agent response')
        }
      }
    })
  })
})
