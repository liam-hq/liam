import { describe, expect, it, vi, beforeEach } from 'vitest'
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
  let mockGetAgent: any

  beforeEach(() => {
    vi.clearAllMocks()

    const langchainModule = require('../../langchain')
    mockGetAgent = vi.mocked(langchainModule.getAgent)

    const mockSchema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: { name: 'id', type: 'uuid', notNull: true, primary: true },
            name: { name: 'name', type: 'text', notNull: true, primary: false },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
      relationships: {},
      tableGroups: {},
    }

    const mockAgent = {
      generate: vi.fn().mockResolvedValue('Mocked agent response'),
      stream: vi.fn(),
    }

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
