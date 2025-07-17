import { AIMessage } from '@langchain/core/messages'
import { ok } from 'neverthrow'
import { describe, expect, it, vi } from 'vitest'
import type { WorkflowState } from '../types'
import { designSchemaNode } from './designSchemaNode'

// Mock the design agent
vi.mock('../../../langchain/agents/databaseSchemaBuildAgent/agent', () => ({
  invokeDesignAgent: vi.fn(),
}))

// Mock the schema converter
vi.mock('../../../utils/convertSchemaToText', () => ({
  convertSchemaToText: vi.fn(() => 'Mocked schema text'),
}))

describe('designSchemaNode retry behavior', () => {
  it('should include DDL failure reason in user message when retrying', async () => {
    // Setup the mock implementation
    const { invokeDesignAgent } = await import(
      '../../../langchain/agents/databaseSchemaBuildAgent/agent'
    )
    const mockInvokeDesignAgent = vi.mocked(invokeDesignAgent)
    mockInvokeDesignAgent.mockResolvedValue(
      ok({
        message: new AIMessage('Schema generated successfully'),
        operations: [],
      }),
    )

    const mockRepositories = {
      schema: {
        updateTimelineItem: vi.fn(),
        getSchema: vi.fn(),
        getDesignSession: vi.fn(),
        createEmptyPatchVersion: vi.fn().mockResolvedValue({
          success: true,
          versionId: 'test-version-id',
        }),
        updateVersion: vi.fn().mockResolvedValue({
          success: true,
          newSchema: { tables: {} },
        }),
        createTimelineItem: vi.fn().mockResolvedValue({
          success: true,
          timelineItem: { id: 'test-timeline-id' },
        }),
        createArtifact: vi.fn(),
        updateArtifact: vi.fn(),
        getArtifact: vi.fn(),
      },
    }

    const mockLogger = {
      log: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }

    const state: WorkflowState = {
      userInput: 'Create a users table',
      messages: [],
      schemaData: { tables: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      designSessionId: 'session-id',
      userId: 'user-id',
      retryCount: { ddlExecutionRetry: 1 },
      shouldRetryWithDesignSchema: true,
      ddlExecutionFailureReason: 'Foreign key constraint error',
    }

    const config = {
      configurable: {
        repositories: mockRepositories,
        logger: mockLogger,
      },
    }

    await designSchemaNode(state, config)

    // Check the invoke call arguments
    expect(mockInvokeDesignAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaText: expect.any(String),
      }),
      expect.arrayContaining([
        expect.objectContaining({
          content: expect.stringContaining('Create a users table'),
        }),
        expect.objectContaining({
          content: expect.stringContaining('Foreign key constraint error'),
        }),
      ]),
    )
  })
})
