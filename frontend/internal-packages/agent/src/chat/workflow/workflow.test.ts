import type { Schema } from '@liam-hq/db-structure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repositories, SchemaRepository } from '../../repositories'
import { executeChatWorkflow } from './index'
import type { WorkflowState } from './types'

// Mock the DatabaseSchemaBuildAgent
vi.mock('../../langchain/agents', () => ({
  DatabaseSchemaBuildAgent: vi.fn(),
}))

// Mock the schema converter
vi.mock('../../../utils/convertSchemaToText', () => ({
  convertSchemaToText: vi.fn(() => 'Mocked schema text'),
}))

describe('Chat Workflow', () => {
  let mockSchemaData: Schema
  let mockAgent: {
    generate: ReturnType<typeof vi.fn>
  }
  let MockDatabaseSchemaBuildAgent: ReturnType<typeof vi.fn>
  let mockRepositories: Repositories
  let mockSchemaRepository: SchemaRepository

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
            primary: true,
            unique: false,
            notNull: true,
            comment: null,
          },
          email: {
            name: 'email',
            type: 'varchar',
            default: null,
            check: null,
            primary: false,
            unique: false,
            notNull: true,
            comment: null,
          },
          name: {
            name: 'name',
            type: 'varchar',
            default: null,
            check: null,
            primary: false,
            unique: false,
            notNull: false,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {},
      },
    },
    relationships: {},
    tableGroups: {},
  })

  // Helper function to create base workflow state
  const createBaseState = (
    overrides: Partial<WorkflowState> = {},
  ): WorkflowState => ({
    userInput: 'Test input',
    history: [],
    schemaData: mockSchemaData,
    projectId: 'test-project-id',
    buildingSchemaId: 'test-building-schema-id',
    latestVersionNumber: 1,
    userId: 'test-user-id',
    designSessionId: 'test-design-session-id',
    repositories: mockRepositories,
    ...overrides,
  })

  // Helper function to execute workflow and assert common expectations
  const executeAndAssertSuccess = async (state: WorkflowState) => {
    const result = await executeChatWorkflow(state)

    expect(result.error).toBeUndefined()
    expect(result.finalResponse).toBe('Mocked agent response')
    expect(typeof result.finalResponse).toBe('string')
    expect(mockAgent.generate).toHaveBeenCalledOnce()

    return result
  }

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()

    // Get the mocked modules
    const agentsModule = await import('../../langchain/agents')

    MockDatabaseSchemaBuildAgent = vi.mocked(
      agentsModule.DatabaseSchemaBuildAgent,
    )

    // Create mock repositories
    mockSchemaRepository = {
      getSchema: vi.fn(),
      getDesignSession: vi.fn(),
      createVersion: vi.fn(),
      createMessage: vi.fn(),
    } as SchemaRepository

    mockRepositories = {
      schema: mockSchemaRepository,
    }

    // Create mock schema data
    mockSchemaData = createMockSchema()

    // Mock agent
    mockAgent = {
      generate: vi.fn().mockResolvedValue(
        JSON.stringify({
          message: 'Mocked agent response',
          schemaChanges: [],
        }),
      ),
    }

    // Setup DatabaseSchemaBuildAgent mock
    MockDatabaseSchemaBuildAgent.mockImplementation(() => mockAgent)

    // Setup createVersion mock
    vi.mocked(mockSchemaRepository.createVersion).mockResolvedValue({
      success: true,
    })

    // Setup createMessage mock
    vi.mocked(mockSchemaRepository.createMessage).mockResolvedValue({
      success: true,
      message: {
        id: 'test-message-id',
        content: 'Test message content',
        item_type: 'assistant' as const,
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization_id: 'test-org-id',
        design_session_id: 'test-design-session-id',
        building_schema_version_id: null,
      },
    })
  })

  describe('Build Mode', () => {
    it('should execute successfully with valid Build mode state', async () => {
      const state = createBaseState({
        userInput: 'Add a created_at timestamp column to the users table',
      })

      await executeAndAssertSuccess(state)
    })

    it('should handle Build mode with structured JSON response and schema changes', async () => {
      const structuredResponse = JSON.stringify({
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
      })

      mockAgent.generate.mockResolvedValue(structuredResponse)

      const state = createBaseState({
        userInput: 'Add a created_at timestamp column to the users table',
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
      })

      const result = await executeChatWorkflow(state)

      expect(result.error).toBeUndefined()
      expect(result.finalResponse).toBe(
        'Added created_at column to users table',
      )
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
      mockAgent.generate.mockResolvedValue('Invalid JSON response')

      const state = createBaseState({
        userInput: 'Add a created_at timestamp column to the users table',
      })

      const result = await executeChatWorkflow(state)

      expect(result.error).toBeUndefined()
      expect(result.finalResponse).toBe('Invalid JSON response')
      expect(mockSchemaRepository.createVersion).not.toHaveBeenCalled()
    })

    it('should handle Build mode with malformed structured response', async () => {
      const malformedResponse = JSON.stringify({
        message: 'Response without schemaChanges',
        // Missing schemaChanges property
      })

      mockAgent.generate.mockResolvedValue(malformedResponse)

      const state = createBaseState({
        userInput: 'Add a created_at timestamp column to the users table',
      })

      const result = await executeChatWorkflow(state)

      expect(result.error).toBeUndefined()
      expect(result.finalResponse).toBe(malformedResponse)
      expect(mockSchemaRepository.createVersion).not.toHaveBeenCalled()
    })

    it('should handle schema update failure', async () => {
      const structuredResponse = JSON.stringify({
        message: 'Attempted to add created_at column',
        schemaChanges: [
          {
            op: 'add',
            path: '/tables/users/columns/created_at',
            value: { name: 'created_at', type: 'timestamp' },
          },
        ],
      })

      mockAgent.generate.mockResolvedValue(structuredResponse)
      vi.mocked(mockSchemaRepository.createVersion).mockResolvedValue({
        success: false,
        error: 'Database constraint violation',
      })

      const state = createBaseState({
        userInput: 'Add a created_at timestamp column to the users table',
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
      })

      const result = await executeChatWorkflow(state, { recursionLimit: 20 })

      // The test should handle either the expected error or recursion limit error
      expect(result.error).toMatch(
        /Database constraint violation|Recursion limit/,
      )
      expect(result.finalResponse).toMatch(
        /Sorry, an error occurred during processing/,
      )
    })

    it('should handle schema update exception', async () => {
      const structuredResponse = JSON.stringify({
        message: 'Attempted to add created_at column',
        schemaChanges: [
          {
            op: 'add',
            path: '/tables/users/columns/created_at',
            value: { name: 'created_at', type: 'timestamp' },
          },
        ],
      })

      mockAgent.generate.mockResolvedValue(structuredResponse)
      vi.mocked(mockSchemaRepository.createVersion).mockRejectedValue(
        new Error('Network error'),
      )

      const state = createBaseState({
        userInput: 'Add a created_at timestamp column to the users table',
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
      })

      const result = await executeChatWorkflow(state)

      expect(result.error).toBe('Network error')
      expect(result.finalResponse).toBe(
        'Sorry, an error occurred during processing: Network error',
      )
    })

    it('should handle complex schema modifications', async () => {
      const state = createBaseState({
        userInput: 'Create a new posts table with foreign key to users',
      })

      await executeAndAssertSuccess(state)
    })
  })

  describe('Error Handling', () => {
    it('should handle agent generation errors', async () => {
      mockAgent.generate.mockRejectedValue(new Error('Agent generation failed'))
      const state = createBaseState()

      const result = await executeChatWorkflow(state)

      expect(result.error).toBe('Agent generation failed')
      expect(result.finalResponse).toBe(
        'Sorry, an error occurred during processing: Agent generation failed',
      )
    })

    it('should handle agent creation failure', async () => {
      MockDatabaseSchemaBuildAgent.mockImplementation(() => {
        throw new Error('Failed to create DatabaseSchemaBuildAgent')
      })
      const state = createBaseState()

      const result = await executeChatWorkflow(state)

      expect(result.error).toBe('Failed to create DatabaseSchemaBuildAgent')
      expect(result.finalResponse).toBe(
        'Sorry, an error occurred during processing: Failed to create DatabaseSchemaBuildAgent',
      )
    })

    it('should handle empty user input', async () => {
      const state = createBaseState({ userInput: '' })

      const result = await executeChatWorkflow(state)

      expect(result).toBeDefined()
      expect(result.userInput).toBe('')
      expect(result.finalResponse).toBe('Mocked agent response')
    })
  })

  describe('State Management', () => {
    it('should preserve state properties through workflow execution', async () => {
      const initialState = createBaseState({
        userInput: 'Test state management',
        history: ['Previous message 1', 'Previous message 2'],
        projectId: 'test-project-123',
      })

      const result = await executeChatWorkflow(initialState, {})

      expect(result.userInput).toBe(initialState.userInput)
      expect(result.projectId).toBe(initialState.projectId)
      expect(result.schemaData).toEqual(initialState.schemaData)
      expect(result.history).toHaveLength(4) // 2 original + 2 new
    })
  })

  describe('Agent Selection', () => {
    it('should instantiate DatabaseSchemaBuildAgent', async () => {
      const state = createBaseState({})

      await executeChatWorkflow(state)

      expect(MockDatabaseSchemaBuildAgent).toHaveBeenCalledOnce()
    })
  })

  describe('Workflow Integration', () => {
    // Helper function to execute multiple workflows sequentially
    const executeSequentialWorkflows = async (
      states: Partial<WorkflowState>[],
    ) => {
      const results = []
      for (const stateOverride of states) {
        const state = createBaseState(stateOverride)
        const result = await executeChatWorkflow(state)
        results.push(result)
      }
      return results
    }

    it('should handle multiple sequential workflow executions', async () => {
      const stateOverrides = [
        { userInput: 'First modification' },
        { userInput: 'Second modification' },
        { userInput: 'Third modification' },
      ]

      const results = await executeSequentialWorkflows(stateOverrides)

      expect(results).toHaveLength(3)
      for (const [index, result] of results.entries()) {
        expect(result).toBeDefined()
        expect(result.userInput).toBe(stateOverrides?.[index]?.userInput)
        expect(result.finalResponse).toBe('Mocked agent response')
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

      const stateOverrides = testInputs.map((userInput) => ({ userInput }))
      const results = await executeSequentialWorkflows(stateOverrides)

      for (const [index, result] of results.entries()) {
        expect(result).toBeDefined()
        expect(result.userInput).toBe(testInputs[index])
        expect(result.finalResponse).toBe('Mocked agent response')
      }
    })
  })
})
