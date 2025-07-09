import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from 'vitest'
import type { DMLGenerationPromptVariables } from '../../../langchain/agents/dmlGenerationAgent'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'
import { prepareDmlNode } from './prepareDmlNode'

// Mock dependencies
vi.mock('../shared/getWorkflowNodeProgress', () => ({
  getWorkflowNodeProgress: vi.fn(),
}))

vi.mock('../../../langchain/agents', () => ({
  DMLGenerationAgent: vi.fn(),
}))

vi.mock('@liam-hq/db-structure', () => ({
  postgresqlSchemaDeparser: vi.fn().mockReturnValue({
    value: `CREATE TABLE users (
  id int NOT NULL,
  email varchar NOT NULL,
  name varchar NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id int NOT NULL,
  user_id int NOT NULL,
  title varchar NOT NULL,
  content text
);`,
    errors: [],
  }),
}))

describe('prepareDmlNode', () => {
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
  let baseState: WorkflowState

  beforeEach(async () => {
    vi.clearAllMocks()

    // Set default mock behavior for DMLGenerationAgent
    const { DMLGenerationAgent } = await import('../../../langchain/agents')
    const mockAgent = {
      generate: vi.fn().mockResolvedValue({
        dmlStatements: `-- User Registration
INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');

-- Create Post
INSERT INTO posts (user_id, title, content) VALUES (1, 'Sample Post', 'Sample content for testing');`,
      }),
    }
    vi.mocked(DMLGenerationAgent).mockReturnValue(
      mockAgent as unknown as InstanceType<typeof DMLGenerationAgent>,
    )

    // Mock logger
    mockLogger = {
      debug: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }

    // Base state with sample schema and use cases
    baseState = {
      userInput: 'Create a user management system',
      formattedHistory: 'test history',
      schemaData: {
        tables: {
          users: {
            name: 'users',
            columns: {
              id: {
                name: 'id',
                type: 'int',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              email: {
                name: 'email',
                type: 'varchar',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              name: {
                name: 'name',
                type: 'varchar',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              created_at: {
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
                default: 'CURRENT_TIMESTAMP',
                check: null,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              users_pkey: {
                type: 'PRIMARY KEY',
                name: 'users_pkey',
                columnNames: ['id'],
              },
              email_unique: {
                type: 'UNIQUE',
                name: 'email_unique',
                columnNames: ['email'],
              },
            },
          },
          posts: {
            name: 'posts',
            columns: {
              id: {
                name: 'id',
                type: 'int',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              user_id: {
                name: 'user_id',
                type: 'int',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              title: {
                name: 'title',
                type: 'varchar',
                notNull: true,
                default: null,
                check: null,
                comment: null,
              },
              content: {
                name: 'content',
                type: 'text',
                notNull: false,
                default: null,
                check: null,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              posts_pkey: {
                type: 'PRIMARY KEY',
                name: 'posts_pkey',
                columnNames: ['id'],
              },
            },
          },
        },
      } satisfies WorkflowState['schemaData'] as WorkflowState['schemaData'],
      generatedUsecases: [
        {
          title: 'User Registration',
          requirementType: 'functional',
          requirementCategory: 'user_management',
          requirement: 'Users should be able to register with email and name',
          description: 'Test user registration functionality',
        },
        {
          title: 'Create Post',
          requirementType: 'functional',
          requirementCategory: 'content_management',
          requirement: 'Users should be able to create posts',
          description: 'Test post creation functionality',
        },
      ] as Usecase[],
      buildingSchemaId: 'schema-123',
      latestVersionNumber: 1,
      userId: 'user-123',
      designSessionId: 'session-123',
      repositories: {
        schema: {
          getSchema: vi.fn(),
          getDesignSession: vi.fn(),
          createVersion: vi.fn(),
          createTimelineItem: vi.fn(),
          updateTimelineItem: vi.fn(),
          createArtifact: vi.fn(),
          updateArtifact: vi.fn(),
          getArtifact: vi.fn(),
        },
      } satisfies WorkflowState['repositories'] as WorkflowState['repositories'],
      logger: mockLogger,
      retryCount: {},
    }

    // Mock utility functions
    vi.mocked(getWorkflowNodeProgress).mockReturnValue(70)
  })

  describe('Agent-based DML Generation', () => {
    it('should use DMLGenerationAgent to generate DML statements', async () => {
      const { DMLGenerationAgent } = await import('../../../langchain/agents')
      const mockGenerate = vi.fn().mockResolvedValue({
        dmlStatements: `-- User Registration
INSERT INTO users (email, name) VALUES ('agent@example.com', 'Agent User');

-- Create Post
INSERT INTO posts (user_id, title, content) VALUES (1, 'Agent Post', 'Content from agent');`,
      })

      vi.mocked(DMLGenerationAgent).mockReturnValue({
        generate: mockGenerate,
      } as unknown as InstanceType<typeof DMLGenerationAgent>)

      const result = await prepareDmlNode(baseState)

      // Verify agent was instantiated
      expect(DMLGenerationAgent).toHaveBeenCalledTimes(1)

      // Verify agent.generate was called with correct parameters
      expect(mockGenerate).toHaveBeenCalledTimes(1)
      const callArgs = mockGenerate.mock
        .calls[0]?.[0] as DMLGenerationPromptVariables
      expect(callArgs.chat_history).toBe(baseState.formattedHistory)
      expect(callArgs.user_message).toContain('Use Cases:')
      expect(callArgs.schema).toContain('CREATE TABLE')

      // Verify the result contains agent-generated DML
      expect(result.dmlStatements).toContain('agent@example.com')
      expect(result.dmlStatements).toContain('Agent Post')
      expect(result.error).toBeUndefined()
    })

    it('should format use cases and schema properly for the agent', async () => {
      const { DMLGenerationAgent } = await import('../../../langchain/agents')
      const mockGenerate = vi.fn().mockResolvedValue({
        dmlStatements: 'Generated DML',
      })

      vi.mocked(DMLGenerationAgent).mockReturnValue({
        generate: mockGenerate,
      } as unknown as InstanceType<typeof DMLGenerationAgent>)

      await prepareDmlNode(baseState)

      const callArgs = mockGenerate.mock
        .calls[0]?.[0] as DMLGenerationPromptVariables

      // Check use cases formatting
      expect(callArgs.user_message).toContain('User Registration')
      expect(callArgs.user_message).toContain('functional')
      expect(callArgs.user_message).toContain('user_management')
      expect(callArgs.user_message).toContain('Create Post')

      // Check schema formatting
      expect(callArgs.schema).toContain('users')
      expect(callArgs.schema).toContain('email')
      expect(callArgs.schema).toContain('posts')
      expect(callArgs.schema).toContain('user_id')
    })

    it('should handle agent errors gracefully', async () => {
      const { DMLGenerationAgent } = await import('../../../langchain/agents')
      const mockGenerate = vi
        .fn()
        .mockRejectedValue(new Error('Agent generation failed'))

      vi.mocked(DMLGenerationAgent).mockReturnValue({
        generate: mockGenerate,
      } as unknown as InstanceType<typeof DMLGenerationAgent>)

      const result = await prepareDmlNode(baseState)

      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toContain('[prepareDmlNode] Failed')
      expect(result.error?.message).toContain('Agent generation failed')
      expect(result.dmlStatements).toBeUndefined()
    })
  })

  describe('Success scenarios', () => {
    it('should generate DML statements for all use cases', async () => {
      const result = await prepareDmlNode(baseState)

      expect(result.dmlStatements).toBeDefined()
      expect(result.dmlStatements).toContain('-- User Registration')
      expect(result.dmlStatements).toContain('INSERT INTO users')
      expect(result.dmlStatements).toContain('-- Create Post')
      expect(result.dmlStatements).toContain('INSERT INTO posts')
      expect(result.error).toBeUndefined()
    })

    it('should generate valid INSERT statements with proper values', async () => {
      const result = await prepareDmlNode(baseState)

      // Check for proper email format
      expect(result.dmlStatements).toMatch(
        /INSERT INTO users[^;]*VALUES[^;]*'[^']+@[^']+\.[^']+'/,
      )
      // Check for proper user name
      expect(result.dmlStatements).toMatch(
        /INSERT INTO users[^;]*VALUES[^;]*'[^']+'[^;]*,\s*'[^']+'/,
      )
    })

    it('should handle relationships in DML generation', async () => {
      const result = await prepareDmlNode(baseState)

      // Should reference existing user IDs in posts
      expect(result.dmlStatements).toMatch(
        /INSERT INTO posts[^;]*VALUES[^;]*\d+/,
      )
    })

    it('should generate UPDATE statements for update use cases', async () => {
      const { DMLGenerationAgent } = await import('../../../langchain/agents')
      vi.mocked(DMLGenerationAgent).mockReturnValue({
        generate: vi.fn().mockResolvedValue({
          dmlStatements: `-- Update User Profile
UPDATE users SET name = 'Updated User' WHERE id = 1;`,
        }),
      } as unknown as InstanceType<typeof DMLGenerationAgent>)

      const stateWithUpdateUseCase = {
        ...baseState,
        generatedUsecases: [
          ...(baseState.generatedUsecases || []),
          {
            title: 'Update User Profile',
            requirementType: 'functional' as const,
            requirementCategory: 'user_management',
            requirement: 'Users should be able to update their profile',
            description: 'Test user profile update functionality',
          },
        ],
      }

      const result = await prepareDmlNode(stateWithUpdateUseCase)

      expect(result.dmlStatements).toContain('-- Update User Profile')
      expect(result.dmlStatements).toContain('UPDATE users')
    })

    it('should generate DELETE statements for deletion use cases', async () => {
      const { DMLGenerationAgent } = await import('../../../langchain/agents')
      vi.mocked(DMLGenerationAgent).mockReturnValue({
        generate: vi.fn().mockResolvedValue({
          dmlStatements: `-- Delete Post
DELETE FROM posts WHERE id = 1;`,
        }),
      } as unknown as InstanceType<typeof DMLGenerationAgent>)

      const stateWithDeleteUseCase = {
        ...baseState,
        generatedUsecases: [
          ...(baseState.generatedUsecases || []),
          {
            title: 'Delete Post',
            requirementType: 'functional' as const,
            requirementCategory: 'content_management',
            requirement: 'Users should be able to delete their posts',
            description: 'Test post deletion functionality',
          },
        ],
      }

      const result = await prepareDmlNode(stateWithDeleteUseCase)

      expect(result.dmlStatements).toContain('-- Delete Post')
      expect(result.dmlStatements).toContain('DELETE FROM posts')
    })

    it('should log progress correctly', async () => {
      await prepareDmlNode(baseState)

      expect(mockLogger.log).toHaveBeenCalledWith('[prepareDmlNode] Started')
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('[prepareDmlNode] Generating DML for'),
      )
      expect(mockLogger.log).toHaveBeenCalledWith('[prepareDmlNode] Completed')
    })

    it('should update progress timeline when available', async () => {
      const stateWithProgress = {
        ...baseState,
        progressTimelineItemId: 'progress-123',
      }

      await prepareDmlNode(stateWithProgress)

      expect(
        baseState.repositories.schema.updateTimelineItem,
      ).toHaveBeenCalledWith('progress-123', {
        content: 'Processing: prepareDML',
        progress: 70,
      })
    })
  })

  describe('Error scenarios', () => {
    it('should handle missing use cases', async () => {
      const stateWithoutUseCases = {
        ...baseState,
        generatedUsecases: undefined,
      }

      const result = await prepareDmlNode(stateWithoutUseCases)

      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe(
        '[prepareDmlNode] No use cases found. Cannot generate DML statements.',
      )
      expect(result.dmlStatements).toBeUndefined()
    })

    it('should handle empty use cases array', async () => {
      const stateWithEmptyUseCases = {
        ...baseState,
        generatedUsecases: [],
      }

      const result = await prepareDmlNode(stateWithEmptyUseCases)

      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe(
        '[prepareDmlNode] No use cases found. Cannot generate DML statements.',
      )
      expect(result.dmlStatements).toBeUndefined()
    })

    it('should handle missing schema data', async () => {
      const stateWithoutSchema = {
        ...baseState,
        schemaData: {
          tables: {},
        } satisfies WorkflowState['schemaData'] as WorkflowState['schemaData'],
      }

      const result = await prepareDmlNode(stateWithoutSchema)

      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe(
        '[prepareDmlNode] No tables found in schema. Cannot generate DML statements.',
      )
      expect(result.dmlStatements).toBeUndefined()
    })

    it('should handle DML generation errors gracefully', async () => {
      // Even with malformed use case, agent should still be called and might generate something
      const { DMLGenerationAgent } = await import('../../../langchain/agents')
      vi.mocked(DMLGenerationAgent).mockReturnValue({
        generate: vi.fn().mockResolvedValue({
          dmlStatements:
            "-- No valid use cases found\n-- Generated minimal test data\nINSERT INTO users (email, name) VALUES ('default@test.com', 'Default User');",
        }),
      } as unknown as InstanceType<typeof DMLGenerationAgent>)

      const stateWithMalformedUseCase = {
        ...baseState,
        generatedUsecases: [
          {
            title: '',
            requirementType: 'functional' as const,
            requirementCategory: '',
            requirement: '',
            description: '',
          },
        ],
      }

      const result = await prepareDmlNode(stateWithMalformedUseCase)

      // Should still generate something even with malformed input
      expect(result.dmlStatements).toBeDefined()
      expect(result.error).toBeUndefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle tables with all column types', async () => {
      const stateWithComplexSchema = {
        ...baseState,
        schemaData: {
          tables: {
            complex_table: {
              name: 'complex_table',
              columns: {
                id: {
                  name: 'id',
                  type: 'int',
                  notNull: true,
                  default: null,
                  check: null,
                  comment: null,
                },
                bool_col: {
                  name: 'bool_col',
                  type: 'boolean',
                  notNull: true,
                  default: null,
                  check: null,
                  comment: null,
                },
                date_col: {
                  name: 'date_col',
                  type: 'date',
                  notNull: true,
                  default: null,
                  check: null,
                  comment: null,
                },
                json_col: {
                  name: 'json_col',
                  type: 'json',
                  notNull: false,
                  default: null,
                  check: null,
                  comment: null,
                },
                decimal_col: {
                  name: 'decimal_col',
                  type: 'decimal',
                  notNull: true,
                  default: null,
                  check: null,
                  comment: null,
                },
              },
              comment: null,
              indexes: {},
              constraints: {
                complex_table_pkey: {
                  type: 'PRIMARY KEY',
                  name: 'complex_table_pkey',
                  columnNames: ['id'],
                },
              },
            },
          },
        } satisfies WorkflowState['schemaData'] as WorkflowState['schemaData'],
      }

      const { DMLGenerationAgent } = await import('../../../langchain/agents')
      vi.mocked(DMLGenerationAgent).mockReturnValue({
        generate: vi.fn().mockResolvedValue({
          dmlStatements: `-- Complex table test data
INSERT INTO complex_table (id, bool_col, date_col, json_col, decimal_col) 
VALUES (1, true, '2024-01-15', '{"key": "value"}', 123.45);`,
        }),
      } as unknown as InstanceType<typeof DMLGenerationAgent>)

      const result = await prepareDmlNode(stateWithComplexSchema)

      expect(result.dmlStatements).toBeDefined()
      // Should generate appropriate values for each type
      expect(result.dmlStatements).toMatch(/true|false/) // boolean
      expect(result.dmlStatements).toMatch(/'\d{4}-\d{2}-\d{2}'/) // date
      expect(result.dmlStatements).toMatch(/\d+\.\d+/) // decimal
    })

    it('should handle non-functional requirements', async () => {
      const { DMLGenerationAgent } = await import('../../../langchain/agents')
      vi.mocked(DMLGenerationAgent).mockReturnValue({
        generate: vi.fn().mockResolvedValue({
          dmlStatements: `-- Performance Test
-- Generating bulk data for performance testing
INSERT INTO users (email, name) VALUES ('user1@test.com', 'User 1');
INSERT INTO users (email, name) VALUES ('user2@test.com', 'User 2');
INSERT INTO users (email, name) VALUES ('user3@test.com', 'User 3');
INSERT INTO users (email, name) VALUES ('user4@test.com', 'User 4');
INSERT INTO users (email, name) VALUES ('user5@test.com', 'User 5');`,
        }),
      } as unknown as InstanceType<typeof DMLGenerationAgent>)

      const stateWithNonFunctionalReq = {
        ...baseState,
        generatedUsecases: [
          {
            title: 'Performance Test',
            requirementType: 'non_functional' as const,
            requirementCategory: 'performance',
            requirement: 'System should handle 1000 concurrent users',
            description: 'Test system performance',
          },
        ],
      }

      const result = await prepareDmlNode(stateWithNonFunctionalReq)

      // Should generate bulk data for performance testing
      expect(result.dmlStatements).toBeDefined()
      expect(result.dmlStatements).toContain('-- Performance Test')
      // Should generate multiple insert statements
      expect(
        (result.dmlStatements?.match(/INSERT INTO/g) || []).length,
      ).toBeGreaterThan(1)
    })

    it('should preserve all state properties', async () => {
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

      const result = await prepareDmlNode(stateWithAdditionalProps)

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

    it('should handle special characters in use case titles', async () => {
      const { DMLGenerationAgent } = await import('../../../langchain/agents')
      vi.mocked(DMLGenerationAgent).mockReturnValue({
        generate: vi.fn().mockResolvedValue({
          dmlStatements: `-- User's "Special" Test & More
INSERT INTO users (email, name) VALUES ('special@test.com', 'Special User');`,
        }),
      } as unknown as InstanceType<typeof DMLGenerationAgent>)

      const stateWithSpecialChars = {
        ...baseState,
        generatedUsecases: [
          {
            title: 'User\'s "Special" Test & More',
            requirementType: 'functional' as const,
            requirementCategory: 'test',
            requirement: 'Test special characters',
            description: 'Test with special chars',
          },
        ],
      }

      const result = await prepareDmlNode(stateWithSpecialChars)

      expect(result.dmlStatements).toBeDefined()
      expect(result.dmlStatements).toContain('-- User\'s "Special" Test & More')
    })
  })
})
