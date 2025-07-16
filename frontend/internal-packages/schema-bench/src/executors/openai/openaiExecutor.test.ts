import { describe, expect, it, vi } from 'vitest'
import { OpenAIExecutor } from './openaiExecutor.ts'

// Mock OpenAI module
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  }
})

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
                      columnName: 'id',
                    },
                  },
                },
              },
            }),
          },
        },
      ],
    }

    const executor = new OpenAIExecutor({ apiKey: 'test-key' })

    // Access the mocked client
    const mockCreate = vi.fn().mockResolvedValue(mockResponse)
    // @ts-ignore - accessing private property for testing
    executor.client.chat.completions.create = mockCreate

    const result = await executor.execute({ input: 'Create a users table' })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toHaveProperty('tables')
      expect(result.value.tables).toHaveProperty('users')
    }

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'o3-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
      }),
    )
  })

  it('should handle API errors', async () => {
    const executor = new OpenAIExecutor({ apiKey: 'test-key' })

    // Mock API error
    const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'))
    // @ts-ignore - accessing private property for testing
    executor.client.chat.completions.create = mockCreate

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

    const executor = new OpenAIExecutor({ apiKey: 'test-key' })

    const mockCreate = vi.fn().mockResolvedValue(mockResponse)
    // @ts-ignore - accessing private property for testing
    executor.client.chat.completions.create = mockCreate

    const result = await executor.execute({ input: 'Create a users table' })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe('No response content from OpenAI')
    }
  })
})
