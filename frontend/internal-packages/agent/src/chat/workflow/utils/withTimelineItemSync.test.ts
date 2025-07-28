import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import type { Database } from '@liam-hq/db'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SchemaRepository } from '../../../repositories/types'
import { withTimelineItemSync } from './withTimelineItemSync.ts'

describe('withTimelineItemSync', () => {
  let mockCreateTimelineItem: ReturnType<typeof vi.fn>
  let mockConsoleError: ReturnType<typeof vi.spyOn>
  let mockRepository: { schema: SchemaRepository }

  const createContext = (
    assistantRole?: Database['public']['Enums']['assistant_role_enum'],
  ) => {
    const context = {
      designSessionId: 'test-session-id',
      organizationId: 'test-org-id',
      userId: 'test-user-id',
      repositories: mockRepository,
      ...(assistantRole && { assistantRole }),
    }
    return context
  }

  beforeEach(() => {
    mockCreateTimelineItem = vi.fn().mockResolvedValue({ success: true })
    mockRepository = {
      schema: {
        createTimelineItem: mockCreateTimelineItem,
        getSchema: vi.fn(),
        getDesignSession: vi.fn(),
        createVersion: vi.fn(),
        updateTimelineItem: vi.fn(),
        createArtifact: vi.fn(),
        updateArtifact: vi.fn(),
        getArtifact: vi.fn(),
        createValidationQuery: vi.fn(),
        createValidationResults: vi.fn(),
        createWorkflowRun: vi.fn(),
        updateWorkflowRunStatus: vi.fn(),
      },
    }
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('AIMessage handling', () => {
    it('should create assistant timeline item with correct parameters', async () => {
      const message = new AIMessage('Test AI response')
      const context = createContext('pm')

      const result = await withTimelineItemSync(message, context)

      expect(mockCreateTimelineItem).toHaveBeenCalledWith({
        designSessionId: 'test-session-id',
        content: 'Test AI response',
        type: 'assistant',
        role: 'pm',
      })
      expect(result).toBe(message)
    })

    it('should default to "db" role when assistantRole not provided', async () => {
      const message = new AIMessage('Test AI response')
      const context = createContext()

      await withTimelineItemSync(message, context)

      expect(mockCreateTimelineItem).toHaveBeenCalledWith({
        designSessionId: 'test-session-id',
        content: 'Test AI response',
        type: 'assistant',
        role: 'db',
      })
    })
  })

  describe('HumanMessage handling', () => {
    it('should create user timeline item with correct parameters', async () => {
      const message = new HumanMessage('User input message')
      const context = createContext()

      const result = await withTimelineItemSync(message, context)

      expect(mockCreateTimelineItem).toHaveBeenCalledWith({
        designSessionId: 'test-session-id',
        content: 'User input message',
        type: 'user',
        userId: 'test-user-id',
      })
      expect(result).toBe(message)
    })
  })

  describe('ToolMessage handling', () => {
    it('should create error timeline item when content contains "error"', async () => {
      const message = new ToolMessage({
        content: 'Error: Something went wrong',
        tool_call_id: 'test-call-id',
      })
      const context = createContext('db')

      const result = await withTimelineItemSync(message, context)

      expect(mockCreateTimelineItem).toHaveBeenCalledWith({
        designSessionId: 'test-session-id',
        content: 'Error: Something went wrong',
        type: 'error',
      })
      expect(result).toBe(message)
    })

    it('should create assistant timeline item when content does not contain error', async () => {
      const message = new ToolMessage({
        content: 'Tool execution successful',
        tool_call_id: 'test-call-id',
      })
      const context = createContext('qa')

      const result = await withTimelineItemSync(message, context)

      expect(mockCreateTimelineItem).toHaveBeenCalledWith({
        designSessionId: 'test-session-id',
        content: 'Tool execution successful',
        type: 'assistant',
        role: 'qa',
      })
      expect(result).toBe(message)
    })

    it('should detect error case-insensitively', async () => {
      const testCases = [
        'ERROR: Something failed',
        'An Error occurred',
        'error in processing',
        'System ERROR detected',
      ]

      for (const content of testCases) {
        const message = new ToolMessage({
          content,
          tool_call_id: 'test-call-id',
        })
        const context = createContext()

        await withTimelineItemSync(message, context)

        expect(mockCreateTimelineItem).toHaveBeenCalledWith({
          designSessionId: 'test-session-id',
          content,
          type: 'error',
        })
      }
    })

    it('should handle object content by stringifying and detecting error', async () => {
      const complexContent = JSON.stringify({
        status: 'error',
        code: 500,
        details: {},
      })
      const message = new ToolMessage({
        content: complexContent,
        tool_call_id: 'test-call-id',
      })
      const context = createContext()

      await withTimelineItemSync(message, context)

      expect(mockCreateTimelineItem).toHaveBeenCalledWith({
        designSessionId: 'test-session-id',
        content: complexContent,
        type: 'error',
      })
    })
  })

  describe('return value', () => {
    it('should return the original message unchanged for all message types', async () => {
      const aiMessage = new AIMessage('AI response')
      const humanMessage = new HumanMessage('Human input')
      const toolMessage = new ToolMessage({
        content: 'Tool output',
        tool_call_id: 'test-id',
      })
      const context = createContext()

      const aiResult = await withTimelineItemSync(aiMessage, context)
      const humanResult = await withTimelineItemSync(humanMessage, context)
      const toolResult = await withTimelineItemSync(toolMessage, context)

      expect(aiResult).toBe(aiMessage)
      expect(humanResult).toBe(humanMessage)
      expect(toolResult).toBe(toolMessage)
    })
  })

  describe('error handling', () => {
    it('should log error and continue when createTimelineItem fails for AIMessage', async () => {
      const message = new AIMessage('Test message')
      const context = createContext()
      const error = new Error('Database connection failed')

      mockCreateTimelineItem.mockResolvedValue({
        success: false,
        error: error.message,
      })

      const result = await withTimelineItemSync(message, context)

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to create timeline item for AIMessage:',
        error.message,
      )
      expect(result).toBe(message)
    })

    it('should log error and continue when createTimelineItem fails for HumanMessage', async () => {
      const message = new HumanMessage('Test message')
      const context = createContext()
      const error = new Error('Network timeout')

      mockCreateTimelineItem.mockResolvedValue({
        success: false,
        error: error.message,
      })

      const result = await withTimelineItemSync(message, context)

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to create timeline item for HumanMessage:',
        error.message,
      )
      expect(result).toBe(message)
    })

    it('should log error and continue when createTimelineItem fails for ToolMessage', async () => {
      const message = new ToolMessage({
        content: 'Error: Tool failed',
        tool_call_id: 'test-id',
      })
      const context = createContext()
      const error = new Error('Validation failed')

      mockCreateTimelineItem.mockResolvedValue({
        success: false,
        error: error.message,
      })

      const result = await withTimelineItemSync(message, context)

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to create timeline item for ToolMessage (error):',
        error.message,
      )
      expect(result).toBe(message)
    })
  })
})
