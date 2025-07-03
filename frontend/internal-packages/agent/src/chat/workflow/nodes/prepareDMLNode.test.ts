import type { Schema } from '@liam-hq/db-structure'
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from 'vitest'
import { QADMLValidationAgent } from '../../../langchain/agents'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { NodeLogger } from '../../../utils/nodeLogger'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'
import { prepareDMLNode } from './prepareDMLNode'

// Mock dependencies
vi.mock('../../../langchain/agents', () => ({
  QADMLValidationAgent: vi.fn(),
}))

vi.mock('../../../utils/convertSchemaToText', () => ({
  convertSchemaToText: vi.fn(),
}))

vi.mock('../shared/getWorkflowNodeProgress', () => ({
  getWorkflowNodeProgress: vi.fn(),
}))

describe('prepareDMLNode', () => {
  let mockAgent: {
    generate: MockedFunction<
      (variables: BasePromptVariables) => Promise<{
        statements: Array<{
          sql: string
          description: string
          expectedResult: 'success' | 'error'
        }>
      }>
    >
  }
  let mockLogger: {
    debug: MockedFunction<
      (message: string, metadata?: Record<string, unknown>) => void
    >
    log: MockedFunction<
      (message: string, metadata?: Record<string, unknown>) => void
    >
    info: MockedFunction<
      (message: string, metadata?: Record<string, unknown>) => void
    >
    warn: MockedFunction<
      (message: string, metadata?: Record<string, unknown>) => void
    >
    error: MockedFunction<
      (message: string, metadata?: Record<string, unknown>) => void
    >
  }
  let mockOnNodeProgress: MockedFunction<
    (nodeName: string, progress: number) => Promise<void>
  >
  let baseState: WorkflowState
  let mockSchema: Schema
  let mockUsecases: Usecase[]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock agent
    mockAgent = {
      generate: vi.fn(),
    }
    const MockQADMLValidationAgent = vi.mocked(QADMLValidationAgent)
    MockQADMLValidationAgent.mockImplementation(
      () => mockAgent as unknown as InstanceType<typeof QADMLValidationAgent>,
    )

    // Mock logger
    mockLogger = {
      debug: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }

    // Mock progress callback
    mockOnNodeProgress = vi.fn()

    // Mock schema
    mockSchema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'INTEGER',
              default: null,
              check: null,
              notNull: true,
              comment: null,
            },
            email: {
              name: 'email',
              type: 'VARCHAR(255)',
              default: null,
              check: null,
              notNull: true,
              comment: null,
            },
            name: {
              name: 'name',
              type: 'VARCHAR(100)',
              default: null,
              check: null,
              notNull: true,
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
    } as Schema

    // Mock usecases
    mockUsecases = [
      {
        title: 'User Registration',
        requirementType: 'functional' as const,
        requirementCategory: 'authentication',
        requirement: 'Users must be able to register with email and password',
        description:
          'System should validate email format and password strength',
      },
      {
        title: 'User Profile Update',
        requirementType: 'functional' as const,
        requirementCategory: 'user_management',
        requirement: 'Users can update their profile information',
        description: 'Allow users to change name and email address',
      },
    ]

    // Base state
    baseState = {
      userInput: 'test input',
      formattedHistory: 'test history',
      schemaData: mockSchema,
      buildingSchemaId: 'schema-123',
      latestVersionNumber: 1,
      userId: 'user-123',
      designSessionId: 'session-123',
      repositories: {} as WorkflowState['repositories'],
      logger: mockLogger as NodeLogger,
      retryCount: {},
      generatedUsecases: mockUsecases,
      onNodeProgress: mockOnNodeProgress,
    }

    // Mock utility functions
    vi.mocked(convertSchemaToText).mockReturnValue('mocked schema text')
    vi.mocked(getWorkflowNodeProgress).mockReturnValue(50)
  })

  describe('Success scenarios', () => {
    it('should generate DML statements successfully', async () => {
      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
          {
            sql: "UPDATE users SET name = 'Updated User' WHERE email = 'test@example.com';",
            description: 'Update user name',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      const result = await prepareDMLNode(baseState)

      expect(result).toEqual({
        ...baseState,
        dmlStatements:
          "-- Insert a valid user record\nINSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');\n\n-- Update user name\nUPDATE users SET name = 'Updated User' WHERE email = 'test@example.com';",
        error: undefined,
      })
    })

    it('should call node progress callback with correct parameters', async () => {
      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      await prepareDMLNode(baseState)

      expect(mockOnNodeProgress).toHaveBeenCalledWith('prepareDML', 50)
    })

    it('should work without node progress callback', async () => {
      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      const stateWithoutProgress = {
        ...baseState,
        onNodeProgress: undefined,
      }

      const result = await prepareDMLNode(stateWithoutProgress)

      expect(result.error).toBeUndefined()
      expect(mockOnNodeProgress).not.toHaveBeenCalled()
    })

    it('should create correct prompt variables', async () => {
      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      await prepareDMLNode(baseState)

      const expectedPromptVariables: BasePromptVariables = {
        chat_history: 'test history',
        user_message: expect.stringContaining('Database Schema:'),
      }

      expect(mockAgent.generate).toHaveBeenCalledWith(expectedPromptVariables)
    })

    it('should format usecases correctly in prompt', async () => {
      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      await prepareDMLNode(baseState)

      const calls = mockAgent.generate.mock.calls
      expect(calls).toHaveLength(1)
      const firstCall = calls[0]
      expect(firstCall).toBeDefined()
      const [promptVariables] = firstCall as [BasePromptVariables]
      const userMessage = (promptVariables as { user_message: string })
        .user_message

      expect(userMessage).toContain('Database Schema:')
      expect(userMessage).toContain('Generated Use Cases:')
      expect(userMessage).toContain('1. User Registration (functional)')
      expect(userMessage).toContain('2. User Profile Update (functional)')
      expect(userMessage).toContain('Category: authentication')
      expect(userMessage).toContain('Category: user_management')
    })

    it('should handle empty statements array', async () => {
      const mockDMLResponse = {
        statements: [],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      const result = await prepareDMLNode(baseState)

      expect(result.dmlStatements).toBe('')
      expect(result.error).toBeUndefined()
    })

    it('should log successful generation', async () => {
      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      await prepareDMLNode(baseState)

      expect(mockLogger.log).toHaveBeenCalledWith('[prepareDMLNode] Started')
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[prepareDMLNode] Generated 1 DML statements',
      )
      expect(mockLogger.log).toHaveBeenCalledWith('[prepareDMLNode] Completed')
    })
  })

  describe('Error scenarios', () => {
    it('should handle missing use cases', async () => {
      const stateWithoutUsecases = {
        ...baseState,
        generatedUsecases: undefined,
      }

      const result = await prepareDMLNode(stateWithoutUsecases)

      expect(result.error).toBe(
        'No generated use cases found. Cannot prepare DML.',
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[prepareDMLNode] No generated use cases found. Cannot prepare DML.',
      )
      expect(mockAgent.generate).not.toHaveBeenCalled()
    })

    it('should handle empty use cases array', async () => {
      const stateWithEmptyUsecases = {
        ...baseState,
        generatedUsecases: [],
      }

      const result = await prepareDMLNode(stateWithEmptyUsecases)

      expect(result.error).toBe(
        'No generated use cases found. Cannot prepare DML.',
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[prepareDMLNode] No generated use cases found. Cannot prepare DML.',
      )
      expect(mockAgent.generate).not.toHaveBeenCalled()
    })

    it('should handle agent generation failure', async () => {
      const errorMessage = 'OpenAI API error'
      mockAgent.generate.mockRejectedValue(new Error(errorMessage))

      const result = await prepareDMLNode(baseState)

      expect(result.error).toBe(errorMessage)
      expect(result.retryCount).toEqual({
        prepareDMLNode: 1,
      })
      expect(mockLogger.error).toHaveBeenCalledWith(
        `[prepareDMLNode] Failed: ${errorMessage}`,
      )
    })

    it('should handle non-Error exceptions', async () => {
      const errorMessage = 'String error'
      mockAgent.generate.mockRejectedValue(errorMessage)

      const result = await prepareDMLNode(baseState)

      expect(result.error).toBe(errorMessage)
      expect(result.retryCount).toEqual({
        prepareDMLNode: 1,
      })
      expect(mockLogger.error).toHaveBeenCalledWith(
        `[prepareDMLNode] Failed: ${errorMessage}`,
      )
    })

    it('should increment retry count correctly', async () => {
      const stateWithRetry = {
        ...baseState,
        retryCount: {
          prepareDMLNode: 2,
          otherNode: 1,
        },
      }

      mockAgent.generate.mockRejectedValue(new Error('Test error'))

      const result = await prepareDMLNode(stateWithRetry)

      expect(result.retryCount).toEqual({
        prepareDMLNode: 3,
        otherNode: 1,
      })
    })

    it('should handle progress callback failure gracefully', async () => {
      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)
      mockOnNodeProgress.mockImplementation(() => {
        throw new Error('Progress callback error')
      })

      // The function should continue despite progress callback error
      await expect(prepareDMLNode(baseState)).rejects.toThrow(
        'Progress callback error',
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle complex use cases with special characters', async () => {
      const complexUsecases = [
        {
          title: 'Complex "Quote" & Ampersand Test',
          requirementType: 'functional' as const,
          requirementCategory: 'data_validation',
          requirement: 'Test with special characters: <>{}[]',
          description: 'Handle various special characters in requirements',
        },
      ]

      const stateWithComplexUsecases = {
        ...baseState,
        generatedUsecases: complexUsecases,
      }

      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      const result = await prepareDMLNode(stateWithComplexUsecases)

      expect(result.error).toBeUndefined()
      const calls = mockAgent.generate.mock.calls
      expect(calls).toHaveLength(1)
      const firstCall = calls[0]
      expect(firstCall).toBeDefined()
      const [promptVariables] = firstCall as [BasePromptVariables]
      expect(
        (promptVariables as { user_message: string }).user_message,
      ).toContain('Complex "Quote" & Ampersand Test')
    })

    it('should handle large number of use cases', async () => {
      const manyUsecases = Array.from({ length: 50 }, (_, i) => ({
        title: `Use Case ${i + 1}`,
        requirementType: 'functional' as const,
        requirementCategory: 'category',
        requirement: `Requirement ${i + 1}`,
        description: `Description ${i + 1}`,
      }))

      const stateWithManyUsecases = {
        ...baseState,
        generatedUsecases: manyUsecases,
      }

      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      const result = await prepareDMLNode(stateWithManyUsecases)

      expect(result.error).toBeUndefined()
      const calls = mockAgent.generate.mock.calls
      expect(calls).toHaveLength(1)
      const firstCall = calls[0]
      expect(firstCall).toBeDefined()
      const [promptVariables] = firstCall as [BasePromptVariables]
      expect(
        (promptVariables as { user_message: string }).user_message,
      ).toContain('50. Use Case 50')
    })

    it('should preserve all state properties when successful', async () => {
      const stateWithAdditionalProps = {
        ...baseState,
        analyzedRequirements: {
          businessRequirement: 'Test requirement',
          functionalRequirements: { auth: ['login', 'logout'] },
          nonFunctionalRequirements: { performance: ['fast'] },
        },
        generatedAnswer: 'Previous answer',
        projectId: 'project-123',
        organizationId: 'org-123',
        ddlStatements: 'CREATE TABLE test();',
      }

      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      const result = await prepareDMLNode(stateWithAdditionalProps)

      expect(result.analyzedRequirements).toEqual(
        stateWithAdditionalProps.analyzedRequirements,
      )
      expect(result.generatedAnswer).toBe(
        stateWithAdditionalProps.generatedAnswer,
      )
      expect(result.projectId).toBe(stateWithAdditionalProps.projectId)
      expect(result.organizationId).toBe(
        stateWithAdditionalProps.organizationId,
      )
      expect(result.ddlStatements).toBe(stateWithAdditionalProps.ddlStatements)
    })
  })

  describe('Integration scenarios', () => {
    it('should use convertSchemaToText correctly', async () => {
      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      await prepareDMLNode(baseState)

      expect(convertSchemaToText).toHaveBeenCalledWith(mockSchema)
    })

    it('should create agent instance correctly', async () => {
      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      await prepareDMLNode(baseState)

      expect(QADMLValidationAgent).toHaveBeenCalledWith()
    })

    it('should get workflow progress correctly', async () => {
      const mockDMLResponse = {
        statements: [
          {
            sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
            description: 'Insert a valid user record',
            expectedResult: 'success' as const,
          },
        ],
      }

      mockAgent.generate.mockResolvedValue(mockDMLResponse)

      await prepareDMLNode(baseState)

      expect(getWorkflowNodeProgress).toHaveBeenCalledWith('prepareDML')
    })
  })
})
