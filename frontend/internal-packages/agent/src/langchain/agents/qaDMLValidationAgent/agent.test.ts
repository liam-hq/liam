import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from 'vitest'
import { createLangfuseHandler } from '../../utils/telemetry'
import type { BasePromptVariables } from '../../utils/types'
import { QADMLValidationAgent } from './agent'
import { dmlGenerationPrompt } from './prompts'

// Mock dependencies
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(),
}))

vi.mock('@valibot/to-json-schema', () => ({
  toJsonSchema: vi.fn(),
}))

vi.mock('valibot', async () => {
  const actual = await vi.importActual('valibot')
  return {
    ...actual,
    parse: vi.fn(),
  }
})

vi.mock('../../utils/telemetry', () => ({
  createLangfuseHandler: vi.fn(),
}))

vi.mock('./prompts', () => ({
  dmlGenerationPrompt: {
    format: vi.fn(),
  },
}))

describe('QADMLValidationAgent', () => {
  let mockBaseModel: {
    withStructuredOutput: MockedFunction<
      (schema: unknown) => typeof mockStructuredModel
    >
  }
  let mockStructuredModel: {
    invoke: MockedFunction<(input: string) => Promise<unknown>>
  }
  let mockLangfuseHandler: { name: string }
  let agent: QADMLValidationAgent

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock structured model
    mockStructuredModel = {
      invoke: vi.fn(),
    }

    // Mock base model
    mockBaseModel = {
      withStructuredOutput: vi.fn().mockReturnValue(mockStructuredModel),
    }

    // Mock ChatOpenAI constructor
    const MockChatOpenAI = vi.mocked(ChatOpenAI)
    MockChatOpenAI.mockImplementation(
      () => mockBaseModel as unknown as InstanceType<typeof ChatOpenAI>,
    )

    // Mock telemetry handler
    mockLangfuseHandler = { name: 'langfuse-handler' }
    vi.mocked(createLangfuseHandler).mockReturnValue(
      mockLangfuseHandler as never,
    )

    // Mock toJsonSchema
    const mockJsonSchema = {
      type: 'object' as const,
      properties: {
        statements: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              sql: { type: 'string' as const },
              description: { type: 'string' as const },
              expectedResult: {
                type: 'string' as const,
                enum: ['success', 'error'],
              },
            },
          },
        },
      },
    }
    vi.mocked(toJsonSchema).mockReturnValue(mockJsonSchema as never)

    // Mock prompt formatting
    vi.mocked(dmlGenerationPrompt.format).mockResolvedValue('formatted prompt')

    // Create agent instance
    agent = new QADMLValidationAgent()
  })

  describe('Constructor', () => {
    it('should initialize ChatOpenAI with correct configuration', () => {
      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: 'gpt-4o',
        callbacks: [mockLangfuseHandler],
      })
    })

    it('should create Langfuse handler', () => {
      expect(createLangfuseHandler).toHaveBeenCalledWith()
    })

    it('should generate JSON schema from response schema', () => {
      expect(toJsonSchema).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should configure model with structured output', () => {
      expect(mockBaseModel.withStructuredOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            statements: expect.any(Object),
          }),
        }),
      )
    })
  })

  describe('generate method', () => {
    describe('Success scenarios', () => {
      it('should generate DML statements successfully', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML for user table',
        }

        const mockLLMResponse = {
          statements: [
            {
              sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
              description: 'Insert a valid user record',
              expectedResult: 'success',
            },
            {
              sql: "UPDATE users SET name = 'Updated User' WHERE email = 'test@example.com';",
              description: 'Update user name',
              expectedResult: 'success',
            },
          ],
        }

        const expectedParsedResponse = {
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

        mockStructuredModel.invoke.mockResolvedValue(mockLLMResponse)
        vi.mocked(v.parse).mockReturnValue(expectedParsedResponse)

        const result = await agent.generate(promptVariables)

        expect(result).toEqual(expectedParsedResponse)
      })

      it('should format prompt with correct variables', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML for user table',
        }

        const mockResponse = {
          statements: [
            {
              sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
              description: 'Insert a valid user record',
              expectedResult: 'success',
            },
          ],
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        await agent.generate(promptVariables)

        expect(dmlGenerationPrompt.format).toHaveBeenCalledWith(promptVariables)
      })

      it('should invoke model with formatted prompt', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML for user table',
        }

        const mockResponse = {
          statements: [
            {
              sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
              description: 'Insert a valid user record',
              expectedResult: 'success',
            },
          ],
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        await agent.generate(promptVariables)

        expect(mockStructuredModel.invoke).toHaveBeenCalledWith(
          'formatted prompt',
        )
      })

      it('should parse response with correct schema', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML for user table',
        }

        const mockResponse = {
          statements: [
            {
              sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
              description: 'Insert a valid user record',
              expectedResult: 'success',
            },
          ],
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        await agent.generate(promptVariables)

        expect(v.parse).toHaveBeenCalledWith(expect.any(Object), mockResponse)
      })

      it('should handle empty statements array', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML for empty schema',
        }

        const mockResponse = {
          statements: [],
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        const result = await agent.generate(promptVariables)

        expect(result.statements).toEqual([])
      })

      it('should handle statements with error expectedResult', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML with constraint violations',
        }

        const mockResponse = {
          statements: [
            {
              sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
              description: 'Insert a valid user record',
              expectedResult: 'success',
            },
            {
              sql: "INSERT INTO users (email, name) VALUES ('invalid-email', 'Test User');",
              description: 'Test email validation constraint',
              expectedResult: 'error',
            },
          ],
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        const result = await agent.generate(promptVariables)

        expect(result.statements).toHaveLength(2)
        expect(result.statements[0]?.expectedResult).toBe('success')
        expect(result.statements[1]?.expectedResult).toBe('error')
      })

      it('should handle complex SQL statements', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate complex DML with joins and subqueries',
        }

        const mockResponse = {
          statements: [
            {
              sql: `
                INSERT INTO orders (user_id, product_id, quantity) 
                SELECT u.id, p.id, 2 
                FROM users u 
                CROSS JOIN products p 
                WHERE u.email = 'test@example.com' AND p.name = 'Test Product'
              `,
              description: 'Insert order with subquery',
              expectedResult: 'success',
            },
            {
              sql: `
                UPDATE users 
                SET last_order_date = (
                  SELECT MAX(created_at) 
                  FROM orders 
                  WHERE orders.user_id = users.id
                ) 
                WHERE id IN (SELECT DISTINCT user_id FROM orders)
              `,
              description: 'Update users with last order date using subquery',
              expectedResult: 'success',
            },
          ],
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        const result = await agent.generate(promptVariables)

        expect(result.statements).toHaveLength(2)
        expect(result.statements[0]?.sql).toContain('CROSS JOIN')
        expect(result.statements[1]?.description).toContain('subquery')
      })
    })

    describe('Error scenarios', () => {
      it('should handle prompt formatting error', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML for user table',
        }

        const formatError = new Error('Prompt formatting failed')
        vi.mocked(dmlGenerationPrompt.format).mockRejectedValue(formatError)

        await expect(agent.generate(promptVariables)).rejects.toThrow(
          'Prompt formatting failed',
        )
      })

      it('should handle model invocation error', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML for user table',
        }

        const modelError = new Error('OpenAI API error')
        mockStructuredModel.invoke.mockRejectedValue(modelError)

        await expect(agent.generate(promptVariables)).rejects.toThrow(
          'OpenAI API error',
        )
      })

      it('should handle response parsing error', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML for user table',
        }

        const mockResponse = {
          invalid_structure: 'not matching schema',
        }

        const parseError = new Error('Schema validation failed')
        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockImplementation(() => {
          throw parseError
        })

        await expect(agent.generate(promptVariables)).rejects.toThrow(
          'Schema validation failed',
        )
      })

      it('should handle malformed model response', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML for user table',
        }

        const malformedResponse = {
          statements: [
            {
              sql: "INSERT INTO users VALUES ('incomplete');",
              // Missing description and expectedResult
            },
          ],
        }

        const parseError = new Error('Missing required fields')
        mockStructuredModel.invoke.mockResolvedValue(malformedResponse)
        vi.mocked(v.parse).mockImplementation(() => {
          throw parseError
        })

        await expect(agent.generate(promptVariables)).rejects.toThrow(
          'Missing required fields',
        )
      })
    })

    describe('Edge cases', () => {
      it('should handle very large number of statements', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate comprehensive DML test suite',
        }

        const largeStatements = Array.from({ length: 100 }, (_, i) => ({
          sql: `INSERT INTO users (email, name) VALUES ('user${i}@example.com', 'User ${i}');`,
          description: `Insert user ${i}`,
          expectedResult: 'success' as const,
        }))

        const mockResponse = {
          statements: largeStatements,
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        const result = await agent.generate(promptVariables)

        expect(result.statements).toHaveLength(100)
        expect(result.statements[0]?.sql).toContain('user0@example.com')
        expect(result.statements[99]?.sql).toContain('user99@example.com')
      })

      it('should handle statements with special characters', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML with special characters',
        }

        const mockResponse = {
          statements: [
            {
              sql: `INSERT INTO users (email, name, bio) VALUES ('test@example.com', 'John "Johnny" O''Connor', 'Bio with \\ backslash & ampersand');`,
              description: 'Insert user with special characters in strings',
              expectedResult: 'success',
            },
            {
              sql: `UPDATE users SET notes = 'Notes with €, ¥, £ symbols' WHERE email = 'test@example.com';`,
              description: 'Update with Unicode characters',
              expectedResult: 'success',
            },
          ],
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        const result = await agent.generate(promptVariables)

        expect(result.statements).toHaveLength(2)
        expect(result.statements[0]?.sql).toContain(`John "Johnny" O'`)
        expect(result.statements[1]?.sql).toContain('€, ¥, £')
      })

      it('should handle empty prompt variables', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: '',
          user_message: '',
        }

        const mockResponse = {
          statements: [],
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        const result = await agent.generate(promptVariables)

        expect(result.statements).toEqual([])
        expect(dmlGenerationPrompt.format).toHaveBeenCalledWith(promptVariables)
      })

      it('should handle long SQL statements', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate very long DML statement',
        }

        const veryLongSQL = `
          INSERT INTO audit_log (
            user_id, action, table_name, record_id, old_values, new_values, 
            timestamp, ip_address, user_agent, session_id, request_id
          ) VALUES (
            1, 'UPDATE', 'users', 123, 
            '{"name":"Old Name","email":"old@example.com","phone":"555-0100"}',
            '{"name":"New Name","email":"new@example.com","phone":"555-0200"}',
            NOW(), '192.168.1.100', 'Mozilla/5.0 (compatible)', 'sess_12345', 'req_67890'
          );
        `.trim()

        const mockResponse = {
          statements: [
            {
              sql: veryLongSQL,
              description:
                'Insert comprehensive audit log entry with all fields',
              expectedResult: 'success',
            },
          ],
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        const result = await agent.generate(promptVariables)

        expect(result.statements).toHaveLength(1)
        expect(result.statements[0]?.sql.length).toBeGreaterThan(400)
        expect(result.statements[0]?.sql).toContain('audit_log')
      })
    })

    describe('Integration scenarios', () => {
      it('should work with different prompt variable combinations', async () => {
        const testCases = [
          {
            chat_history: 'User asked about users table',
            user_message: 'Generate INSERT statements',
          },
          {
            chat_history: 'Long conversation about schema design...',
            user_message: 'Create comprehensive test data',
          },
          {
            chat_history: '',
            user_message: 'Simple DML generation request',
          },
        ]

        for (const promptVariables of testCases) {
          const mockResponse = {
            statements: [
              {
                sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
                description: 'Insert test user',
                expectedResult: 'success',
              },
            ],
          }

          mockStructuredModel.invoke.mockResolvedValue(mockResponse)
          vi.mocked(v.parse).mockReturnValue(mockResponse)

          const result = await agent.generate(promptVariables)

          expect(result.statements).toHaveLength(1)
          expect(dmlGenerationPrompt.format).toHaveBeenCalledWith(
            promptVariables,
          )
        }
      })

      it('should maintain consistent schema validation across calls', async () => {
        const promptVariables: BasePromptVariables = {
          chat_history: 'Previous conversation',
          user_message: 'Generate DML statements',
        }

        const mockResponse = {
          statements: [
            {
              sql: "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');",
              description: 'Insert test user',
              expectedResult: 'success',
            },
          ],
        }

        mockStructuredModel.invoke.mockResolvedValue(mockResponse)
        vi.mocked(v.parse).mockReturnValue(mockResponse)

        // Call multiple times
        await agent.generate(promptVariables)
        await agent.generate(promptVariables)
        await agent.generate(promptVariables)

        // Schema should be used consistently
        expect(v.parse).toHaveBeenCalledTimes(3)
        expect(v.parse).toHaveBeenNthCalledWith(
          1,
          expect.any(Object),
          mockResponse,
        )
        expect(v.parse).toHaveBeenNthCalledWith(
          2,
          expect.any(Object),
          mockResponse,
        )
        expect(v.parse).toHaveBeenNthCalledWith(
          3,
          expect.any(Object),
          mockResponse,
        )
      })
    })
  })
})
