import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import type { Database } from '@liam-hq/db'
import { describe, expect, it, vi } from 'vitest'
import { InMemoryRepository } from '../../../repositories/InMemoryRepository'
import { withTimelineItemSync } from './withTimelineItemSync'

describe('withTimelineItemSync', () => {
  const createContext = (
    assistantRole?: Database['public']['Enums']['assistant_role_enum'],
  ) => {
    const repository = new InMemoryRepository({
      designSessions: {
        'test-session-id': {
          organization_id: 'test-org-id',
          timeline_items: [],
        },
      },
    })

    return {
      designSessionId: 'test-session-id',
      organizationId: 'test-org-id',
      userId: 'test-user-id',
      repositories: { schema: repository },
      repository, // Return repository for test access
      ...(assistantRole && { assistantRole }),
    }
  }

  describe('AIMessage handling', () => {
    it('should create assistant timeline item with correct parameters', async () => {
      const message = new AIMessage('Test AI response')
      const context = createContext('pm')

      const result = await withTimelineItemSync(message, context)

      const timelineItems =
        context.repository.getTimelineItems('test-session-id')
      expect(timelineItems).toHaveLength(1)
      expect(timelineItems[0]).toMatchObject({
        content: 'Test AI response',
        type: 'assistant',
        assistant_role: 'pm',
        design_session_id: 'test-session-id',
      })
      expect(result).toBe(message)
    })

    it('should default to "db" role when assistantRole not provided', async () => {
      const message = new AIMessage('Test AI response')
      const context = createContext()

      await withTimelineItemSync(message, context)

      const timelineItems =
        context.repository.getTimelineItems('test-session-id')
      expect(timelineItems).toHaveLength(1)
      expect(timelineItems[0]).toMatchObject({
        content: 'Test AI response',
        type: 'assistant',
        assistant_role: 'db',
        design_session_id: 'test-session-id',
      })
    })

    it('should create error timeline item when AIMessage contains error', async () => {
      const message = new AIMessage('Error: Failed to process request')
      const context = createContext('db')

      const result = await withTimelineItemSync(message, context)

      const timelineItems =
        context.repository.getTimelineItems('test-session-id')
      expect(timelineItems).toHaveLength(1)
      expect(timelineItems[0]).toMatchObject({
        content: 'Error: Failed to process request',
        type: 'error',
        design_session_id: 'test-session-id',
      })
      expect(result).toBe(message)
    })

    it('should detect validation errors in AIMessage', async () => {
      const message = new AIMessage(
        'Database validation found 3 issues. Please fix the following errors:\n\n- "User Registration":\n  - column "name" does not exist',
      )
      const context = createContext('db')

      const result = await withTimelineItemSync(message, context)

      const timelineItems =
        context.repository.getTimelineItems('test-session-id')
      expect(timelineItems).toHaveLength(1)
      expect(timelineItems[0]).toMatchObject({
        content:
          'Database validation found 3 issues. Please fix the following errors:\n\n- "User Registration":\n  - column "name" does not exist',
        type: 'error',
        design_session_id: 'test-session-id',
      })
      expect(result).toBe(message)
    })
  })

  describe('HumanMessage handling', () => {
    it('should create user timeline item with correct parameters', async () => {
      const message = new HumanMessage('User input message')
      const context = createContext()

      const result = await withTimelineItemSync(message, context)

      const timelineItems =
        context.repository.getTimelineItems('test-session-id')
      expect(timelineItems).toHaveLength(1)
      expect(timelineItems[0]).toMatchObject({
        content: 'User input message',
        type: 'user',
        user_id: 'test-user-id',
        design_session_id: 'test-session-id',
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

      const timelineItems =
        context.repository.getTimelineItems('test-session-id')
      expect(timelineItems).toHaveLength(1)
      expect(timelineItems[0]).toMatchObject({
        content: 'Error: Something went wrong',
        type: 'error',
        design_session_id: 'test-session-id',
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

      const timelineItems =
        context.repository.getTimelineItems('test-session-id')
      expect(timelineItems).toHaveLength(1)
      expect(timelineItems[0]).toMatchObject({
        content: 'Tool execution successful',
        type: 'assistant',
        assistant_role: 'qa',
        design_session_id: 'test-session-id',
      })
      expect(result).toBe(message)
    })

    it('should detect error case-insensitively', async () => {
      const context = createContext()
      const testCases = [
        'ERROR: Something failed',
        'An Error occurred',
        'error in processing',
        'System ERROR detected',
      ]

      for (let i = 0; i < testCases.length; i++) {
        const content = testCases[i]
        if (!content) continue
        const message = new ToolMessage({
          content,
          tool_call_id: 'test-call-id',
        })

        await withTimelineItemSync(message, context)

        const timelineItems =
          context.repository.getTimelineItems('test-session-id')
        expect(timelineItems).toHaveLength(i + 1)
        expect(timelineItems[i]).toMatchObject({
          content,
          type: 'error',
          design_session_id: 'test-session-id',
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

      const timelineItems =
        context.repository.getTimelineItems('test-session-id')
      expect(timelineItems).toHaveLength(1)
      expect(timelineItems[0]).toMatchObject({
        content: complexContent,
        type: 'error',
        design_session_id: 'test-session-id',
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

      // Verify all timeline items were created
      const timelineItems =
        context.repository.getTimelineItems('test-session-id')
      expect(timelineItems).toHaveLength(3)
    })
  })

  describe('error handling', () => {
    it('should log error and continue when createTimelineItem fails for AIMessage', async () => {
      const mockConsoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const message = new AIMessage('Test message')

      // Create a repository that will fail
      const failingRepository = new InMemoryRepository()
      vi.spyOn(failingRepository, 'createTimelineItem').mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      })

      const context = {
        designSessionId: 'test-session-id',
        organizationId: 'test-org-id',
        userId: 'test-user-id',
        repositories: { schema: failingRepository },
      }

      const result = await withTimelineItemSync(message, context)

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to create timeline item for AIMessage (assistant):',
        'Database connection failed',
      )
      expect(result).toBe(message)

      mockConsoleError.mockRestore()
    })

    it('should log error and continue when createTimelineItem fails for HumanMessage', async () => {
      const mockConsoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const message = new HumanMessage('Test message')

      // Create a repository that will fail
      const failingRepository = new InMemoryRepository()
      vi.spyOn(failingRepository, 'createTimelineItem').mockResolvedValue({
        success: false,
        error: 'Network timeout',
      })

      const context = {
        designSessionId: 'test-session-id',
        organizationId: 'test-org-id',
        userId: 'test-user-id',
        repositories: { schema: failingRepository },
      }

      const result = await withTimelineItemSync(message, context)

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to create timeline item for HumanMessage:',
        'Network timeout',
      )
      expect(result).toBe(message)

      mockConsoleError.mockRestore()
    })

    it('should log error and continue when createTimelineItem fails for ToolMessage', async () => {
      const mockConsoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const message = new ToolMessage({
        content: 'Error: Tool failed',
        tool_call_id: 'test-id',
      })

      // Create a repository that will fail
      const failingRepository = new InMemoryRepository()
      vi.spyOn(failingRepository, 'createTimelineItem').mockResolvedValue({
        success: false,
        error: 'Validation failed',
      })

      const context = {
        designSessionId: 'test-session-id',
        organizationId: 'test-org-id',
        userId: 'test-user-id',
        repositories: { schema: failingRepository },
      }

      const result = await withTimelineItemSync(message, context)

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to create timeline item for ToolMessage (error):',
        'Validation failed',
      )
      expect(result).toBe(message)

      mockConsoleError.mockRestore()
    })
  })
})
