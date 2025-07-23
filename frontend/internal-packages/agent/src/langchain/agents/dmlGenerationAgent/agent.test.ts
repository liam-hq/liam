import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usecase } from '../qaGenerateUsecaseAgent/agent'
import { DMLGenerationAgent } from './agent'

// Mock the langchain modules
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    withStructuredOutput: vi.fn().mockReturnValue({
      invoke: vi.fn(),
    }),
  })),
}))

vi.mock('../../utils/telemetry', () => ({
  createLangfuseHandler: vi.fn().mockReturnValue([]),
}))

describe('DMLGenerationAgent', () => {
  const mockUsecase: Usecase = {
    requirementType: 'functional',
    requirementCategory: 'User Management',
    requirement: 'Users should be able to register and login',
    title: 'User Registration',
    description: 'Allow users to create accounts with email and password',
  }

  const mockDdlStatements = `
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  const mockSchemaContext = 'Schema with users table for authentication'

  describe('generateDMLForUsecase', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should generate multiple DML operations for a use case', async () => {
      // Arrange
      const agent = new DMLGenerationAgent()
      const mockOperations = [
        {
          sql: "INSERT INTO users (id, email, password_hash) VALUES ('user1', 'test@example.com', 'hash123')",
          operationType: 'INSERT',
          purpose: 'Create test user for registration',
          expectedOutcome: 'User record created successfully',
          order: 1,
        },
        {
          sql: "SELECT * FROM users WHERE email = 'test@example.com'",
          operationType: 'SELECT',
          purpose: 'Verify user was created',
          expectedOutcome: 'Should return the created user',
          order: 2,
        },
      ]
      // @ts-expect-error - accessing private property for testing
      vi.mocked(agent['model'].invoke).mockResolvedValue(mockOperations)

      // Act
      const result = await agent.generateDMLForUsecase({
        usecase: mockUsecase,
        ddlStatements: mockDdlStatements,
        schemaContext: mockSchemaContext,
      })

      // Assert
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const operations = result.value

        // Should have multiple operations
        expect(operations.length).toBeGreaterThan(0)

        // Each operation should have required fields
        operations.forEach((op, index) => {
          expect(op).toMatchObject({
            sql: expect.any(String),
            operationType: expect.stringMatching(
              /^(INSERT|UPDATE|DELETE|SELECT)$/,
            ),
            purpose: expect.any(String),
            expectedOutcome: expect.any(String),
            order: index + 1,
          })
        })

        // Should include at least one INSERT for test data
        const insertOps = operations.filter(
          (op) => op.operationType === 'INSERT',
        )
        expect(insertOps.length).toBeGreaterThan(0)

        // Should include at least one SELECT for validation
        const selectOps = operations.filter(
          (op) => op.operationType === 'SELECT',
        )
        expect(selectOps.length).toBeGreaterThan(0)
      }
    })

    it('should generate operations in correct execution order', async () => {
      // Arrange
      const agent = new DMLGenerationAgent()
      const mockOperations = [
        {
          sql: "INSERT INTO users (id, email) VALUES (1, 'user1@test.com')",
          operationType: 'INSERT',
          purpose: 'Setup test data',
          expectedOutcome: 'User created',
          order: 1,
        },
        {
          sql: "INSERT INTO users (id, email) VALUES (2, 'user2@test.com')",
          operationType: 'INSERT',
          purpose: 'Setup additional test data',
          expectedOutcome: 'Second user created',
          order: 2,
        },
        {
          sql: 'SELECT COUNT(*) FROM users',
          operationType: 'SELECT',
          purpose: 'Verify data',
          expectedOutcome: 'Should return 2',
          order: 3,
        },
      ]
      // @ts-expect-error - accessing private property for testing
      vi.mocked(agent['model'].invoke).mockResolvedValue(mockOperations)

      // Act
      const result = await agent.generateDMLForUsecase({
        usecase: mockUsecase,
        ddlStatements: mockDdlStatements,
        schemaContext: mockSchemaContext,
      })

      // Assert
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const operations = result.value

        // Order should be sequential starting from 1
        operations.forEach((op, index) => {
          expect(op.order).toBe(index + 1)
        })

        // INSERTs should come before SELECTs
        const insertIndex = operations.findIndex(
          (op) => op.operationType === 'INSERT',
        )
        const selectIndex = operations.findIndex(
          (op) => op.operationType === 'SELECT',
        )

        if (insertIndex !== -1 && selectIndex !== -1) {
          expect(insertIndex).toBeLessThan(selectIndex)
        }
      }
    })

    it('should handle non-functional requirements appropriately', async () => {
      // Arrange
      const agent = new DMLGenerationAgent()
      const nonFunctionalUsecase: Usecase = {
        requirementType: 'non_functional',
        requirementCategory: 'Performance',
        requirement: 'System should handle 1000 concurrent users',
        title: 'Load Testing',
        description: 'Verify system can handle high load',
      }
      const mockOperations = [
        {
          sql: "INSERT INTO users (id, email, password_hash) SELECT generate_series(1, 1000), 'user' || generate_series(1, 1000) || '@test.com', 'hash123'",
          operationType: 'INSERT',
          purpose: 'Generate bulk test data for load testing',
          expectedOutcome: '1000 users created',
          order: 1,
        },
        {
          sql: 'SELECT COUNT(*) FROM users',
          operationType: 'SELECT',
          purpose: 'Verify bulk data creation',
          expectedOutcome: 'Should return 1000',
          order: 2,
        },
      ]
      // @ts-expect-error - accessing private property for testing
      vi.mocked(agent['model'].invoke).mockResolvedValue(mockOperations)

      // Act
      const result = await agent.generateDMLForUsecase({
        usecase: nonFunctionalUsecase,
        ddlStatements: mockDdlStatements,
        schemaContext: mockSchemaContext,
      })

      // Assert
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const operations = result.value

        // Should generate bulk operations for load testing
        const hasLoadTestData = operations.some(
          (op) =>
            op.purpose.toLowerCase().includes('load') ||
            op.purpose.toLowerCase().includes('bulk') ||
            op.purpose.toLowerCase().includes('performance'),
        )
        expect(hasLoadTestData).toBe(true)
      }
    })

    it('should handle errors gracefully', async () => {
      // Arrange
      const agent = new DMLGenerationAgent()
      vi.mocked(agent['model'].invoke).mockRejectedValue(
        new Error('LLM API error'),
      )

      // Act
      const result = await agent.generateDMLForUsecase({
        usecase: mockUsecase,
        ddlStatements: mockDdlStatements,
        schemaContext: mockSchemaContext,
      })

      // Assert
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('LLM API error')
      }
    })

    it('should generate SQL that references the correct tables', async () => {
      // Arrange
      const agent = new DMLGenerationAgent()
      const mockOperations = [
        {
          sql: "INSERT INTO users (email, password_hash) VALUES ('test@example.com', 'hash123')",
          operationType: 'INSERT',
          purpose: 'Create test user',
          expectedOutcome: 'User created',
          order: 1,
        },
        {
          sql: "SELECT * FROM users WHERE email = 'test@example.com'",
          operationType: 'SELECT',
          purpose: 'Query users table',
          expectedOutcome: 'User found',
          order: 2,
        },
      ]
      // @ts-expect-error - accessing private property for testing
      vi.mocked(agent['model'].invoke).mockResolvedValue(mockOperations)

      // Act
      const result = await agent.generateDMLForUsecase({
        usecase: mockUsecase,
        ddlStatements: mockDdlStatements,
        schemaContext: mockSchemaContext,
      })

      // Assert
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const operations = result.value

        // SQL should reference the users table
        const sqlReferencesUsersTable = operations.some((op) =>
          op.sql.toLowerCase().includes('users'),
        )
        expect(sqlReferencesUsersTable).toBe(true)
      }
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should handle empty DDL statements', async () => {
      // Arrange
      const agent = new DMLGenerationAgent()
      const mockOperations = [
        {
          sql: 'SELECT 1',
          operationType: 'SELECT',
          purpose: 'Basic connectivity test',
          expectedOutcome: 'Should return 1',
          order: 1,
        },
      ]
      // @ts-expect-error - accessing private property for testing
      vi.mocked(agent['model'].invoke).mockResolvedValue(mockOperations)

      // Act
      const result = await agent.generateDMLForUsecase({
        usecase: mockUsecase,
        ddlStatements: '',
        schemaContext: mockSchemaContext,
      })

      // Assert
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // Should still generate some operations, even if generic
        expect(result.value.length).toBeGreaterThan(0)
      }
    })

    it('should handle use cases with special characters', async () => {
      // Arrange
      const agent = new DMLGenerationAgent()
      const specialUsecase: Usecase = {
        ...mockUsecase,
        title: 'User\'s "Special" Case',
        description: 'Handle input with quotes, apostrophes, and \n newlines',
      }
      const mockOperations = [
        {
          sql: "INSERT INTO users (email, password_hash) VALUES ('user''s@test.com', 'hash123')",
          operationType: 'INSERT',
          purpose: 'Test special characters handling',
          expectedOutcome: 'User with special chars created',
          order: 1,
        },
      ]
      // @ts-expect-error - accessing private property for testing
      vi.mocked(agent['model'].invoke).mockResolvedValue(mockOperations)

      // Act
      const result = await agent.generateDMLForUsecase({
        usecase: specialUsecase,
        ddlStatements: mockDdlStatements,
        schemaContext: mockSchemaContext,
      })

      // Assert
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // Should properly escape special characters in SQL
        const operations = result.value
        operations.forEach((op) => {
          // SQL should be valid (basic check)
          expect(op.sql).toBeTruthy()
          expect(op.sql.length).toBeGreaterThan(0)
        })
      }
    })
  })

  // Keep existing tests for backward compatibility
  describe('legacy generate method', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })
    it('should create an instance of DMLGenerationAgent', () => {
      const agent = new DMLGenerationAgent()
      expect(agent).toBeDefined()
      expect(agent).toBeInstanceOf(DMLGenerationAgent)
    })

    it('should have a generate method', () => {
      const agent = new DMLGenerationAgent()
      expect(agent.generate).toBeDefined()
      expect(typeof agent.generate).toBe('function')
    })

    it('should return dmlStatements from generate method', async () => {
      const agent = new DMLGenerationAgent()
      const input = {
        schemaSQL: 'CREATE TABLE users (id INT PRIMARY KEY);',
        formattedUseCases: 'User registration use case',
        schemaContext: 'Mock schema context',
      }

      const result = await agent.generate(input)

      expect(result).toBeDefined()
      expect(result.dmlStatements).toBeDefined()
      expect(typeof result.dmlStatements).toBe('string')
    })
  })
})
