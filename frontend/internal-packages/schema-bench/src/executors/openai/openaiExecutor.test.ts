import OpenAI from 'openai'
import { describe, expect, it, vi } from 'vitest'
import { OpenAIExecutor } from './openaiExecutor.ts'

// Mock OpenAI constructor
vi.mock('openai', () => {
  return {
    default: vi.fn(),
  }
})

const MockedOpenAI = vi.mocked(OpenAI)

// Helper function to create mock OpenAI client without type assertion issues
const setupMockOpenAI = (mockCreate: ReturnType<typeof vi.fn>) => {
  const mockClient = {
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  MockedOpenAI.mockImplementation(() => mockClient as unknown as OpenAI)
}

describe('OpenAIExecutor', () => {
  it('should execute and return schema', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
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
                      comment: 'Primary key',
                    },
                  },
                  comment: 'Users table',
                  indexes: {},
                  constraints: {
                    users_pkey: {
                      type: 'PRIMARY KEY',
                      name: 'users_pkey',
                      columnNames: ['id'],
                    },
                  },
                },
              },
            }),
          },
        },
      ],
    }

    const mockCreate = vi.fn().mockResolvedValue(mockResponse)
    setupMockOpenAI(mockCreate)

    const executor = new OpenAIExecutor({ apiKey: 'test-key' })

    const result = await executor.execute({ input: 'Create a users table' })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toHaveProperty('tables')
      expect(result.value.tables).toHaveProperty('users')
    }

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'o4-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
      }),
    )
  })

  it('should handle API errors', async () => {
    const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'))
    setupMockOpenAI(mockCreate)

    const executor = new OpenAIExecutor({ apiKey: 'test-key' })

    const result = await executor.execute({ input: 'Create a users table' })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe('API Error')
    }
  })

  it('should handle empty response', async () => {
    const mockResponse = {
      choices: [{ message: { content: null } }],
    }

    const mockCreate = vi.fn().mockResolvedValue(mockResponse)
    setupMockOpenAI(mockCreate)

    const executor = new OpenAIExecutor({ apiKey: 'test-key' })

    const result = await executor.execute({ input: 'Create a users table' })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe('No response content from OpenAI')
    }
  })
})
