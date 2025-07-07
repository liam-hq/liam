import { describe, expect, it, vi } from 'vitest'
import type { WorkflowState } from '../types'
import { designSchemaNode } from './designSchemaNode'

describe('designSchemaNode retry behavior', () => {
  it('should include DDL failure reason in user message when retrying', async () => {
    const mockAgent = {
      generate: vi.fn().mockResolvedValue({
        schema: { tables: {} },
      }),
    }

    vi.mock('../../../langchain/agents', () => ({
      QASchemaGenerateAgent: vi.fn(() => mockAgent),
    }))

    const state = {
      userInput: 'Create a users table',
      formattedHistory: '',
      schemaData: { tables: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      repositories: {
        schema: {
          updateTimelineItem: vi.fn(),
          createBuildingSchema: vi.fn(),
          getSchema: vi.fn(),
          getDesignSession: vi.fn(),
          createVersion: vi.fn(),
          createTimelineItem: vi.fn(),
          getTimelineItems: vi.fn(),
          updateBuildingSchema: vi.fn(),
          createArtifact: vi.fn(),
          updateArtifact: vi.fn(),
          getArtifact: vi.fn(),
        },
      },
      designSessionId: 'session-id',
      userId: 'user-id',
      logger: {
        log: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      },
      retryCount: { ddlExecutionRetry: 1 },
      shouldRetryWithDesignSchema: true,
      ddlExecutionFailureReason: 'Foreign key constraint error',
    } as WorkflowState

    await designSchemaNode(state)

    const generateCall = mockAgent.generate.mock.calls[0]?.[0] as
      | { user_message: string }
      | undefined
    expect(generateCall?.user_message).toContain('Create a users table')
    expect(generateCall?.user_message).toContain('Foreign key constraint error')
  })
})
