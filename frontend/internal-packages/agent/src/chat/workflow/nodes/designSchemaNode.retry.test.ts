import { describe, expect, it, vi } from 'vitest'
import type { WorkflowState } from '../types'
import { designSchemaNode } from './designSchemaNode'

// Mock the agents
vi.mock('../../../langchain/agents', () => ({
  DatabaseSchemaBuildAgent: vi.fn().mockImplementation(() => ({
    generate: vi.fn(),
  })),
}))

// Mock the schema converter
vi.mock('../../../utils/convertSchemaToText', () => ({
  convertSchemaToText: vi.fn(() => 'Mocked schema text'),
}))

describe('designSchemaNode retry behavior', () => {
  it('should include DDL failure reason in user message when retrying', async () => {
    // Setup the mock implementation
    const { DatabaseSchemaBuildAgent } = await import(
      '../../../langchain/agents'
    )
    const mockGenerate = vi.fn().mockResolvedValue({
      schema: { tables: {} },
      schemaChanges: [],
      message: 'Schema generated successfully',
    })

    vi.mocked(DatabaseSchemaBuildAgent).mockImplementation(
      () =>
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        ({
          generate: mockGenerate,
        }) as never,
    )

    const state: WorkflowState = {
      userInput: 'Create a users table',
      formattedHistory: '',
      schemaData: { tables: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      repositories: {
        schema: {
          updateTimelineItem: vi.fn(),
          getSchema: vi.fn(),
          getDesignSession: vi.fn(),
          createVersion: vi.fn(),
          createTimelineItem: vi.fn().mockResolvedValue({
            success: true,
            timelineItem: { id: 'test-timeline-id' },
          }),
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
    }

    await designSchemaNode(state)

    // Check the generate call arguments
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_message: expect.stringContaining('Create a users table'),
      }),
    )
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_message: expect.stringContaining('Foreign key constraint error'),
      }),
    )
  })
})
