import type { Schema } from '@liam-hq/db-structure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeChatWorkflow } from './index'
import type { WorkflowState } from './types'

// Mock the LangChain module
vi.mock('../../langchain', () => ({
  getAgent: vi.fn(),
  createPromptVariables: vi.fn(
    (schemaText: string, userMessage: string, history: [string, string][]) => ({
      schema_text: schemaText,
      user_message: userMessage,
      chat_history:
        history
          .map(([role, content]: [string, string]) => `${role}: ${content}`)
          .join('\n') || 'No previous conversation.',
    }),
  ),
}))

// Mock the schema converter
vi.mock('@/app/lib/schema/convertSchemaToText', () => ({
  convertSchemaToText: vi.fn(() => 'Mocked schema text'),
}))

// Mock the createNewVersion function
vi.mock('../../utils/createNewVersion', () => ({
  createNewVersion: vi.fn(),
}))

describe('Chat Workflow', () => {
  let mockSchemaData: Schema
  let mockAgent: {
    generate: ReturnType<typeof vi.fn>
    stream: ReturnType<typeof vi.fn>
  }
  let mockGetAgent: ReturnType<typeof vi.fn>
  let mockCreateNewVersion: ReturnType<typeof vi.fn>

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
    ...overrides,
  })

  // Helper function to execute workflow and assert common expectations
  const executeAndAssertSuccess = async (state: WorkflowState) => {
    const result = await executeChatWorkflow(state, { streaming: false })

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
    const langchainModule = await import('../../langchain')
    const schemaModule = await import('../../utils/createNewVersion')

    mockGetAgent = vi.mocked(langchainModule.getAgent)
    mockCreateNewVersion = vi.mocked(schemaModule.createNewVersion)

    // Create mock schema data
    mockSchemaData = createMockSchema()

    // Mock agent
    mockAgent = {
      generate: vi.fn().mockResolvedValue('Mocked agent response'),
      stream: vi.fn().mockReturnValue(
        (async function* () {
          yield 'Mocked agent response'
        })(),
      ),
    }

    // Setup langchain mock
    mockGetAgent.mockReturnValue(mockAgent)

    // Setup createNewVersion mock
    mockCreateNewVersion.mockResolvedValue({
      success: true,
      versionNumber: 2,
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

      const result = await executeChatWorkflow(state, { streaming: false })

      expect(result.error).toBeUndefined()
      expect(result.finalResponse).toBe(
        'Added created_at column to users table',
      )
      expect(mockCreateNewVersion).toHaveBeenCalledWith({
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

      const result = await executeChatWorkflow(state, { streaming: false })

      expect(result.error).toBeUndefined()
      expect(result.finalResponse).toBe('Invalid JSON response')
      expect(mockCreateNewVersion).not.toHaveBeenCalled()
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

      const result = await executeChatWorkflow(state, { streaming: false })

      expect(result.error).toBeUndefined()
      expect(result.finalResponse).toBe(malformedResponse)
      expect(mockCreateNewVersion).not.toHaveBeenCalled()
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
      mockCreateNewVersion.mockResolvedValue({
        success: false,
        error: 'Database constraint violation',
      })

      const state = createBaseState({
        userInput: 'Add a created_at timestamp column to the users table',
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
      })

      const result = await executeChatWorkflow(state, { streaming: false })

      expect(result.error).toBe('Database constraint violation')
      expect(result.finalResponse).toBe(
        'Sorry, an error occurred during processing: Database constraint violation',
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
      mockCreateNewVersion.mockRejectedValue(new Error('Network error'))

      const state = createBaseState({
        userInput: 'Add a created_at timestamp column to the users table',
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
      })

      const result = await executeChatWorkflow(state, { streaming: false })

      expect(result.error).toBe('Failed to update schema: Network error')
      expect(result.finalResponse).toBe(
        'Sorry, an error occurred during processing: Failed to update schema: Network error',
      )
    })

    it('should handle Build mode without buildingSchemaId', async () => {
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

      const state = createBaseState({
        userInput: 'Add a created_at timestamp column to the users table',
        buildingSchemaId: undefined,
      })

      const result = await executeChatWorkflow(state, {
        streaming: false,
      })

      expect(result.error).toBeUndefined()
      expect(result.finalResponse).toBe('Attempted to add created_at column')
      expect(mockCreateNewVersion).not.toHaveBeenCalled()
    })

    it('should handle complex schema modifications', async () => {
      const state = createBaseState({
        userInput: 'Create a new posts table with foreign key to users',
      })

      await executeAndAssertSuccess(state)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing schema data gracefully', async () => {
      const testState = createBaseState({
        userInput: 'What is the database structure?',
      })
      // Remove schemaData property by creating a new object without it
      const { schemaData, ...stateWithoutSchema } = testState
      const invalidState = stateWithoutSchema as WorkflowState

      const result = await executeChatWorkflow(invalidState, {
        streaming: false,
      })

      expect(result).toBeDefined()
      expect(result.error).toBe('Schema data is required for answer generation')
    })

    it('should handle agent generation errors', async () => {
      mockAgent.generate.mockRejectedValue(new Error('Agent generation failed'))
      const state = createBaseState()

      const result = await executeChatWorkflow(state, { streaming: false })

      expect(result.error).toBe('Agent generation failed')
      expect(result.finalResponse).toBe(
        'Sorry, an error occurred during processing: Agent generation failed',
      )
    })

    it('should handle missing agent', async () => {
      mockGetAgent.mockImplementation(() => {
        throw new Error(
          'databaseSchemaBuildAgent not found in LangChain instance',
        )
      })
      const state = createBaseState()

      const result = await executeChatWorkflow(state, { streaming: false })

      expect(result.error).toBe(
        'databaseSchemaBuildAgent not found in LangChain instance',
      )
      expect(result.finalResponse).toBe(
        'Sorry, an error occurred during processing: databaseSchemaBuildAgent not found in LangChain instance',
      )
    })

    it('should handle empty user input', async () => {
      const state = createBaseState({ userInput: '' })

      const result = await executeChatWorkflow(state, { streaming: false })

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

      const result = await executeChatWorkflow(initialState, {
        streaming: false,
      })

      expect(result.userInput).toBe(initialState.userInput)
      expect(result.projectId).toBe(initialState.projectId)
      expect(result.schemaData).toEqual(initialState.schemaData)
      expect(result.history).toHaveLength(4) // 2 original + 2 new
    })
  })

  describe('Agent Selection', () => {
    it('should use databaseSchemaBuildAgent for Build mode', async () => {
      const state = createBaseState({})

      await executeChatWorkflow(state, { streaming: false })

      expect(mockGetAgent).toHaveBeenCalledWith('databaseSchemaBuildAgent')
    })
  })

  describe('Workflow Integration', () => {
    // Helper function to execute multiple workflows sequentially
    const executeSequentialWorkflows = async (
      states: Partial<WorkflowState>[],
    ) => {
      const results = []
      for (const stateOverride of states) {
        // Reset mocks for each execution
        mockAgent.stream.mockReturnValue(
          (async function* () {
            yield 'Mocked agent response'
          })(),
        )
        const state = createBaseState(stateOverride)
        const result = await executeChatWorkflow(state, { streaming: false })
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
