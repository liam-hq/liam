import type { Schema } from '@liam-hq/db-structure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { Repositories } from '../../../repositories'
import type { NodeLogger } from '../../../utils/nodeLogger'
import type { WorkflowState } from '../types'
import { prepareDMLNode } from './prepareDMLNode'

// Mock the agents
vi.mock('../../../langchain/agents', () => ({
  QADMLGenerationAgent: vi.fn(),
}))

// Mock the schema converter
vi.mock('../../../utils/convertSchemaToText', () => ({
  convertSchemaToText: vi.fn(() => 'Mocked schema text'),
}))

describe('prepareDMLNode', () => {
  let mockSchemaData: Schema
  let mockRepositories: Repositories
  let mockLogger: NodeLogger
  let mockQADMLGenerationAgent: {
    generate: ReturnType<typeof vi.fn>
  }
  let MockQADMLGenerationAgent: ReturnType<typeof vi.fn>

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

  // Helper function to create mock usecases
  const createMockUsecases = (): Usecase[] => [
    {
      requirementType: 'functional',
      requirementCategory: 'User Management',
      requirement: 'Users should be able to register with email and name',
      title: 'User Registration',
      description: 'Test user registration functionality',
    },
    {
      requirementType: 'functional',
      requirementCategory: 'User Management',
      requirement: 'Users should be able to update their profile',
      title: 'Profile Update',
      description: 'Test user profile update functionality',
    },
  ]

  // Helper function to create base workflow state
  const createBaseState = (
    overrides: Partial<WorkflowState> = {},
  ): WorkflowState => ({
    userInput: 'Test input for DML generation',
    formattedHistory: 'No previous conversation.',
    schemaData: mockSchemaData,
    projectId: 'test-project-id',
    buildingSchemaId: 'test-building-schema-id',
    latestVersionNumber: 1,
    userId: 'test-user-id',
    designSessionId: 'test-design-session-id',
    repositories: mockRepositories,
    logger: mockLogger,
    retryCount: {},
    generatedUsecases: createMockUsecases(),
    ...overrides,
  })

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()

    // Get the mocked modules
    const agentsModule = await import('../../../langchain/agents')
    MockQADMLGenerationAgent = vi.mocked(agentsModule.QADMLGenerationAgent)

    // Create mock repositories
    mockRepositories = {
      schema: {
        getSchema: vi.fn(),
        getDesignSession: vi.fn(),
        createVersion: vi.fn(),
        createTimelineItem: vi.fn(),
        updateTimelineItem: vi.fn(),
      },
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

    // Mock QA DML Generation agent
    mockQADMLGenerationAgent = {
      generate: vi
        .fn()
        .mockResolvedValue(
          "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
        ),
    }

    // Setup agent mocks
    MockQADMLGenerationAgent.mockImplementation(() => mockQADMLGenerationAgent)
  })

  describe('Normal cases', () => {
    it('should generate DML statements successfully with valid usecases', async () => {
      const state = createBaseState()

      const result = await prepareDMLNode(state)

      expect(result.error).toBeUndefined()
      expect(result.dmlStatements).toBeDefined()
      expect(typeof result.dmlStatements).toBe('string')
      expect(result.dmlStatements).toContain('INSERT INTO users')
      expect(mockQADMLGenerationAgent.generate).toHaveBeenCalledOnce()
      expect(mockLogger.log).toHaveBeenCalledWith('[prepareDMLNode] Started')
      expect(mockLogger.log).toHaveBeenCalledWith('[prepareDMLNode] Completed')
    })

    it('should call onNodeProgress callback when provided', async () => {
      const mockOnNodeProgress = vi.fn().mockResolvedValue(undefined)
      const state = createBaseState({
        onNodeProgress: mockOnNodeProgress,
      })

      await prepareDMLNode(state)

      expect(mockOnNodeProgress).toHaveBeenCalledWith(
        'prepareDML',
        expect.any(Number),
      )
    })

    it('should preserve existing state properties', async () => {
      const state = createBaseState({
        userInput: 'Custom test input',
        projectId: 'custom-project-id',
      })

      const result = await prepareDMLNode(state)

      expect(result.userInput).toBe('Custom test input')
      expect(result.projectId).toBe('custom-project-id')
      expect(result.schemaData).toEqual(mockSchemaData)
    })
  })

  describe('Error cases', () => {
    it('should return error when generatedUsecases is undefined', async () => {
      const state = createBaseState({
        generatedUsecases: undefined,
      })

      const result = await prepareDMLNode(state)

      expect(result.error).toBe(
        'No generated usecases found. Cannot prepare DML statements.',
      )
      expect(result.dmlStatements).toBeUndefined()
      expect(mockQADMLGenerationAgent.generate).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[prepareDMLNode] No generated usecases found. Cannot prepare DML statements.',
      )
    })

    it('should return error when generatedUsecases is empty array', async () => {
      const state = createBaseState({
        generatedUsecases: [],
      })

      const result = await prepareDMLNode(state)

      expect(result.error).toBe(
        'No generated usecases found. Cannot prepare DML statements.',
      )
      expect(result.dmlStatements).toBeUndefined()
      expect(mockQADMLGenerationAgent.generate).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[prepareDMLNode] No generated usecases found. Cannot prepare DML statements.',
      )
    })

    it('should handle agent generation failure', async () => {
      const errorMessage = 'DML generation failed'
      mockQADMLGenerationAgent.generate.mockRejectedValue(
        new Error(errorMessage),
      )

      const state = createBaseState()

      const result = await prepareDMLNode(state)

      expect(result.error).toBe(errorMessage)
      expect(result.dmlStatements).toBeUndefined()
      expect(result.retryCount['prepareDMLNode']).toBe(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        `[prepareDMLNode] Failed: ${errorMessage}`,
      )
    })

    it('should increment retry count on multiple failures', async () => {
      const errorMessage = 'DML generation failed'
      mockQADMLGenerationAgent.generate.mockRejectedValue(
        new Error(errorMessage),
      )

      const state = createBaseState({
        retryCount: { prepareDMLNode: 2 },
      })

      const result = await prepareDMLNode(state)

      expect(result.error).toBe(errorMessage)
      expect(result.retryCount['prepareDMLNode']).toBe(3)
    })

    it('should handle non-Error exceptions', async () => {
      const errorMessage = 'Non-Error exception'
      mockQADMLGenerationAgent.generate.mockRejectedValue(errorMessage)

      const state = createBaseState()

      const result = await prepareDMLNode(state)

      expect(result.error).toBe(errorMessage)
      expect(result.dmlStatements).toBeUndefined()
      expect(mockLogger.error).toHaveBeenCalledWith(
        `[prepareDMLNode] Failed: ${errorMessage}`,
      )
    })
  })

  describe('Agent invocation', () => {
    it('should pass correct parameters to QA DML Generation agent', async () => {
      const state = createBaseState()

      await prepareDMLNode(state)

      expect(mockQADMLGenerationAgent.generate).toHaveBeenCalledWith({
        schema_text: expect.any(String),
        chat_history: state.formattedHistory,
        user_message: expect.stringContaining('User Registration'),
        usecases: expect.arrayContaining([
          expect.objectContaining({
            title: 'User Registration',
            description: 'Test user registration functionality',
          }),
        ]),
      })
    })

    it('should format usecases into readable text for the agent', async () => {
      const customUsecases: Usecase[] = [
        {
          requirementType: 'functional',
          requirementCategory: 'Authentication',
          requirement: 'Users must authenticate securely',
          title: 'Secure Login',
          description: 'Test secure user authentication',
        },
      ]

      const state = createBaseState({
        generatedUsecases: customUsecases,
      })

      await prepareDMLNode(state)

      expect(mockQADMLGenerationAgent.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          user_message: expect.stringContaining('Secure Login'),
          usecases: customUsecases,
        }),
      )
    })
  })
})
