import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeChatWorkflow } from './index'
import type { WorkflowState } from './types'

vi.mock('../../langchain', () => ({
  getAgent: vi.fn(),
  createPromptVariables: vi.fn(
    (schemaText: string, userMessage: string, history: [string, string][]) => ({
      schema_text: schemaText,
      user_message: userMessage,
      chat_history: history.map(([role, msg]) => `${role}: ${msg}`).join('\n'),
    }),
  ),
}))

vi.mock('../../vectorstore/convertSchemaToText', () => ({
  convertSchemaToText: vi.fn(() => 'Mocked schema text'),
}))

describe('Chat Workflow', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    const langchainModule = await import('../../langchain')
    const mockGetAgent = vi.mocked(langchainModule.getAgent)

    const mockAgent = {
      generate: vi.fn().mockResolvedValue('Mocked agent response'),
      stream: vi.fn(),
      // biome-ignore lint/suspicious/noExplicitAny: Required for test mocking
    } as any

    mockGetAgent.mockReturnValue(mockAgent)
  })

  it('should execute workflow successfully', async () => {
    const initialState: WorkflowState = {
      mode: 'Ask',
      userInput: 'What tables do we have?',
      history: [],
      buildingSchemaId: 'test-schema-id',
      schemaData: {
        tables: {},
        relationships: {},
        tableGroups: {},
      },
    }

    const result = executeChatWorkflow(initialState, { streaming: false })
    expect(result).toBeDefined()
  })
})
