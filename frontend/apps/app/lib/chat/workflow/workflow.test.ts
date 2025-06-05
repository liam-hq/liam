import type { Schema } from '@liam-hq/db-structure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeChatWorkflow } from './index'
import type { WorkflowState } from './types'

// Mock the LangChain module
vi.mock('@/lib/langchain', () => ({
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

describe('Chat Workflow', () => {
  let mockSchemaData: Schema
  let mockAgent: {
    generate: ReturnType<typeof vi.fn>
    stream: ReturnType<typeof vi.fn>
  }
  let mockGetAgent: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()

    // Get the mocked langchain module
    const langchainModule = await import('@/lib/langchain')
    mockGetAgent = vi.mocked(langchainModule.getAgent)

    // Mock schema data for testing
    mockSchemaData = {
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
    }

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
  })

  describe('Ask Mode', () => {
    it('should execute successfully with valid Ask mode state', async () => {
      const askState: WorkflowState = {
        mode: 'Ask',
        userInput: 'What is the users table structure?',
        history: [],
        schemaData: mockSchemaData,
        projectId: 'test-project-id',
        buildingSchemaId: 'test-building-schema-id',
      }

      const result = await executeChatWorkflow(askState, { streaming: false })

      expect(result.mode).toBe('Ask')
      expect(result.error).toBeUndefined()
      expect(result.finalResponse).toBe('Mocked agent response')
      expect(typeof result.finalResponse).toBe('string')
      expect(mockAgent.generate).toHaveBeenCalledOnce()
    })

    it('should handle Ask mode with history', async () => {
      const askState: WorkflowState = {
        mode: 'Ask',
        userInput: 'What is the users table structure?',
        history: ['Previous message 1', 'Previous message 2'],
        schemaData: mockSchemaData,
        projectId: 'test-project-id',
        buildingSchemaId: 'test-building-schema-id',
      }

      const result = await executeChatWorkflow(askState, { streaming: false })

      expect(result.mode).toBe('Ask')
      expect(result.error).toBeUndefined()
      // History should be updated with new conversation
      expect(result.history).toHaveLength(4) // 2 original + 2 new (user + assistant)
      expect(result.history).toContain(
        'User: What is the users table structure?',
      )
      expect(result.history).toContain('Assistant: Mocked agent response')
    })
  })

  describe('Build Mode', () => {
    it('should execute successfully with valid Build mode state', async () => {
      const buildState: WorkflowState = {
        mode: 'Build',
        userInput: 'Add a created_at timestamp column to the users table',
        history: [],
        schemaData: mockSchemaData,
        projectId: 'test-project-id',
        buildingSchemaId: 'test-building-schema-id',
      }

      const result = await executeChatWorkflow(buildState, { streaming: false })

      expect(result.mode).toBe('Build')
      expect(result.error).toBeUndefined()
      expect(result.finalResponse).toBe('Mocked agent response')
      expect(typeof result.finalResponse).toBe('string')
      expect(mockAgent.generate).toHaveBeenCalledOnce()
    })

    it('should handle Build mode with complex schema modifications', async () => {
      const buildState: WorkflowState = {
        mode: 'Build',
        userInput: 'Create a new posts table with foreign key to users',
        history: [],
        schemaData: mockSchemaData,
        projectId: 'test-project-id',
        buildingSchemaId: 'test-building-schema-id',
      }

      const result = await executeChatWorkflow(buildState, { streaming: false })

      expect(result.mode).toBe('Build')
      expect(result.error).toBeUndefined()
      expect(result.finalResponse).toBe('Mocked agent response')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing mode gracefully', async () => {
      const invalidState: WorkflowState = {
        // mode is missing - should trigger validation error
        userInput: 'What is the users table structure?',
        history: [],
        schemaData: mockSchemaData,
        projectId: 'test-project-id',
        buildingSchemaId: 'test-building-schema-id',
      }

      const result = await executeChatWorkflow(invalidState, {
        streaming: false,
      })

      expect(result).toBeDefined()
      expect(result.userInput).toBe('What is the users table structure?')
      expect(result.error).toBe('Mode must be selected in UI before processing')
    })

    it('should handle missing schema data', async () => {
      const noSchemaState: WorkflowState = {
        mode: 'Ask',
        userInput: 'What is the database structure?',
        history: [],
        projectId: 'test-project-id',
        buildingSchemaId: 'test-building-schema-id',
      }

      const result = await executeChatWorkflow(noSchemaState, {
        streaming: false,
      })

      expect(result).toBeDefined()
      expect(result.mode).toBe('Ask')
      expect(result.error).toBe('Schema data is required for answer generation')
    })

    it('should handle agent generation errors', async () => {
      // Mock agent to throw an error
      mockAgent.generate.mockRejectedValue(new Error('Agent generation failed'))

      const errorState: WorkflowState = {
        mode: 'Ask',
        userInput: 'Test input',
        history: [],
        schemaData: mockSchemaData,
        projectId: 'test-project-id',
        buildingSchemaId: 'test-building-schema-id',
      }

      const result = await executeChatWorkflow(errorState, {
        streaming: false,
      })

      // The workflow now provides a proper error response to the user
      expect(result.error).toBe('Agent generation failed')
      expect(result.finalResponse).toBe(
        'Sorry, an error occurred during processing: Agent generation failed',
      )
    })

    it('should handle missing agent', async () => {
      // Mock getAgent to throw error (simulating agent initialization failure)
      mockGetAgent.mockImplementation(() => {
        throw new Error(
          'databaseSchemaAskAgent not found in LangChain instance',
        )
      })

      const errorState: WorkflowState = {
        mode: 'Ask',
        userInput: 'Test input',
        history: [],
        schemaData: mockSchemaData,
        projectId: 'test-project-id',
        buildingSchemaId: 'test-building-schema-id',
      }

      const result = await executeChatWorkflow(errorState, {
        streaming: false,
      })

      // The workflow now provides a proper error response to the user
      expect(result.error).toBe(
        'databaseSchemaAskAgent not found in LangChain instance',
      )
      expect(result.finalResponse).toBe(
        'Sorry, an error occurred during processing: databaseSchemaAskAgent not found in LangChain instance',
      )
    })

    it('should handle empty user input', async () => {
      const emptyInputState: WorkflowState = {
        mode: 'Ask',
        userInput: '',
        history: [],
        schemaData: mockSchemaData,
        projectId: 'test-project-id',
        buildingSchemaId: 'test-building-schema-id',
      }

      const result = await executeChatWorkflow(emptyInputState, {
        streaming: false,
      })

      expect(result).toBeDefined()
      expect(result.userInput).toBe('')
      expect(result.finalResponse).toBe('Mocked agent response')
    })
  })

  describe('State Management', () => {
    it('should preserve state properties through workflow execution', async () => {
      const initialState: WorkflowState = {
        mode: 'Ask',
        userInput: 'Test state management',
        history: ['Previous message 1', 'Previous message 2'],
        schemaData: mockSchemaData,
        projectId: 'test-project-123',
        buildingSchemaId: 'test-building-schema-id',
      }

      const result = await executeChatWorkflow(initialState, {
        streaming: false,
      })

      expect(result.userInput).toBe(initialState.userInput)
      expect(result.projectId).toBe(initialState.projectId)
      expect(result.schemaData).toEqual(initialState.schemaData)
      // History should be updated with new conversation
      expect(result.history).toHaveLength(4) // 2 original + 2 new
    })
  })

  describe('Agent Selection', () => {
    it('should use databaseSchemaAskAgent for Ask mode', async () => {
      const askState: WorkflowState = {
        mode: 'Ask',
        userInput: 'Test question',
        history: [],
        schemaData: mockSchemaData,
        projectId: 'test-project',
        buildingSchemaId: 'test-building-schema-id',
      }

      await executeChatWorkflow(askState, { streaming: false })

      expect(mockGetAgent).toHaveBeenCalledWith('databaseSchemaAskAgent')
    })

    it('should use databaseSchemaBuildAgent for Build mode', async () => {
      const buildState: WorkflowState = {
        mode: 'Build',
        userInput: 'Test modification',
        history: [],
        schemaData: mockSchemaData,
        projectId: 'test-project',
        buildingSchemaId: 'test-building-schema-id',
      }

      await executeChatWorkflow(buildState, { streaming: false })

      expect(mockGetAgent).toHaveBeenCalledWith('databaseSchemaBuildAgent')
    })
  })

  describe('Workflow Integration', () => {
    it('should handle multiple sequential workflow executions', async () => {
      const states: WorkflowState[] = [
        {
          mode: 'Ask',
          userInput: 'First question',
          history: [],
          schemaData: mockSchemaData,
          projectId: 'test-project',
          buildingSchemaId: 'test-building-schema-id',
        },
        {
          mode: 'Build',
          userInput: 'First modification',
          history: [],
          schemaData: mockSchemaData,
          projectId: 'test-project',
          buildingSchemaId: 'test-building-schema-id',
        },
        {
          mode: 'Ask',
          userInput: 'Follow-up question',
          history: [],
          schemaData: mockSchemaData,
          projectId: 'test-project',
          buildingSchemaId: 'test-building-schema-id',
        },
      ]

      // Execute sequentially to avoid mock conflicts
      const results = []
      for (const state of states) {
        // Reset mocks for each execution
        mockAgent.stream.mockReturnValue(
          (async function* () {
            yield 'Mocked agent response'
          })(),
        )
        const result = await executeChatWorkflow(state, { streaming: false })
        results.push(result)
      }

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result).toBeDefined()
        expect(result.mode).toBe(states[index].mode)
        expect(result.userInput).toBe(states[index].userInput)
        expect(result.finalResponse).toBe('Mocked agent response')
      })
    })

    it('should maintain consistency across different input types', async () => {
      const testCases = [
        'Simple question about users table',
        'Complex query with multiple joins and conditions',
        'Schema modification request with constraints',
        'Question with special characters: @#$%^&*()',
        'Multi-line\ninput\nwith\nbreaks',
      ]

      // Execute sequentially to avoid mock conflicts
      const results = []
      for (const userInput of testCases) {
        // Reset mocks for each execution
        mockAgent.stream.mockReturnValue(
          (async function* () {
            yield 'Mocked agent response'
          })(),
        )
        const result = await executeChatWorkflow(
          {
            mode: 'Ask',
            userInput,
            history: [],
            schemaData: mockSchemaData,
            projectId: 'consistency-test',
            buildingSchemaId: 'test-building-schema-id',
          },
          { streaming: false },
        )
        results.push(result)
      }

      results.forEach((result, index) => {
        expect(result).toBeDefined()
        expect(result.userInput).toBe(testCases[index])
        expect(result.finalResponse).toBe('Mocked agent response')
      })
    })
  })
})
