import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import {
  filterOrphanedToolMessages,
  isMessageContentError,
  isToolMessageError,
  validateToolCallConsistency,
} from './toolMessageUtils'

describe('toolMessageUtils', () => {
  describe('isToolMessageError', () => {
    it('should identify ToolMessage as error when content contains error keyword', () => {
      const message = new ToolMessage({
        content: 'Error: Something went wrong',
        tool_call_id: 'test-id',
      })
      expect(isToolMessageError(message)).toBe(true)
    })

    it('should identify ToolMessage as error regardless of case sensitivity', () => {
      const message = new ToolMessage({
        content: 'ERROR: Configuration failed',
        tool_call_id: 'test-id',
      })
      expect(isToolMessageError(message)).toBe(true)
    })

    it('should identify ToolMessage as error when error keyword appears mid-sentence', () => {
      const message = new ToolMessage({
        content: 'Failed to process: Error occurred',
        tool_call_id: 'test-id',
      })
      expect(isToolMessageError(message)).toBe(true)
    })

    it('should not identify ToolMessage as error when content has no error keyword', () => {
      const message = new ToolMessage({
        content: 'Operation completed successfully',
        tool_call_id: 'test-id',
      })
      expect(isToolMessageError(message)).toBe(false)
    })

    it('should not identify non-ToolMessage as error even when content contains error keyword', () => {
      const aiMessage = new AIMessage('Error: This is an AI message')
      expect(isToolMessageError(aiMessage)).toBe(false)

      const humanMessage = new HumanMessage('Error: This is a human message')
      expect(isToolMessageError(humanMessage)).toBe(false)
    })

    it('should not identify non-ToolMessage as error when content has no error keyword', () => {
      const aiMessage = new AIMessage('This is a normal AI message')
      expect(isToolMessageError(aiMessage)).toBe(false)

      const humanMessage = new HumanMessage('This is a normal human message')
      expect(isToolMessageError(humanMessage)).toBe(false)
    })
  })

  describe('isMessageContentError', () => {
    it('should identify content as error when it contains error keyword', () => {
      expect(isMessageContentError('Error: Something went wrong')).toBe(true)
      expect(isMessageContentError('ERROR: Configuration failed')).toBe(true)
      expect(isMessageContentError('error occurred during processing')).toBe(
        true,
      )
    })

    it('should identify content as error with case-insensitive matching', () => {
      expect(isMessageContentError('Failed to process: Error occurred')).toBe(
        true,
      )
      expect(isMessageContentError('An ErRoR happened')).toBe(true)
    })

    it('should not identify content as error when no error keyword is present', () => {
      expect(isMessageContentError('Operation completed successfully')).toBe(
        false,
      )
      expect(isMessageContentError('Processing data')).toBe(false)
      expect(isMessageContentError('No issues found')).toBe(false)
    })

    it('should not identify content as error when error appears as part of other words', () => {
      expect(isMessageContentError('Erroneous data detected')).toBe(false)
      expect(isMessageContentError('Terror alert level')).toBe(false)
    })

    it('should not identify empty content as error', () => {
      expect(isMessageContentError('')).toBe(false)
    })

    it('should handle whitespace-only content correctly', () => {
      expect(isMessageContentError('   ')).toBe(false)
      expect(isMessageContentError('  error  ')).toBe(true)
    })

    it('should handle punctuation and special characters around error keyword', () => {
      expect(isMessageContentError('error!')).toBe(true)
      expect(isMessageContentError('(error)')).toBe(true)
      expect(isMessageContentError('error.')).toBe(true)
      expect(isMessageContentError('error,')).toBe(true)
      expect(isMessageContentError('error:')).toBe(true)
      expect(isMessageContentError('error;')).toBe(true)
    })

    it('should handle multiline content with error keyword', () => {
      expect(
        isMessageContentError('First line\nerror occurred\nLast line'),
      ).toBe(true)
      expect(isMessageContentError('First line\nSecond line\nThird line')).toBe(
        false,
      )
    })

    it('should handle error keyword at start and end of content', () => {
      expect(isMessageContentError('error at the beginning')).toBe(true)
      expect(isMessageContentError('something went error')).toBe(true)
      expect(isMessageContentError('error')).toBe(true)
    })
  })

  describe('filterOrphanedToolMessages', () => {
    it('should keep ToolMessages with corresponding AI tool calls', () => {
      const aiMessage = new AIMessage({
        content: 'I need to update the schema',
        tool_calls: [{ id: 'call_123', name: 'schemaDesignTool', args: {} }],
      })
      const toolMessage = new ToolMessage({
        content: 'Schema updated successfully',
        tool_call_id: 'call_123',
      })

      const messages = [aiMessage, toolMessage]
      const filtered = filterOrphanedToolMessages(messages)

      expect(filtered).toHaveLength(2)
      expect(filtered).toContain(aiMessage)
      expect(filtered).toContain(toolMessage)
    })

    it('should remove ToolMessages without corresponding AI tool calls', () => {
      const orphanedToolMessage = new ToolMessage({
        content: 'Orphaned response',
        tool_call_id: 'call_orphaned',
      })
      const humanMessage = new HumanMessage('Hello')

      const messages = [humanMessage, orphanedToolMessage]
      const filtered = filterOrphanedToolMessages(messages)

      expect(filtered).toHaveLength(1)
      expect(filtered).toContain(humanMessage)
      expect(filtered).not.toContain(orphanedToolMessage)
    })

    it('should preserve message order when filtering', () => {
      const humanMessage = new HumanMessage('Hello')
      const aiMessage = new AIMessage({
        content: 'Using tool',
        tool_calls: [{ id: 'call_valid', name: 'tool', args: {} }],
      })
      const validToolMessage = new ToolMessage({
        content: 'Valid response',
        tool_call_id: 'call_valid',
      })
      const orphanedToolMessage = new ToolMessage({
        content: 'Orphaned response',
        tool_call_id: 'call_orphaned',
      })

      const messages = [
        humanMessage,
        aiMessage,
        validToolMessage,
        orphanedToolMessage,
      ]
      const filtered = filterOrphanedToolMessages(messages)

      expect(filtered).toHaveLength(3)
      expect(filtered[0]).toBe(humanMessage)
      expect(filtered[1]).toBe(aiMessage)
      expect(filtered[2]).toBe(validToolMessage)
    })

    it('should handle empty messages array', () => {
      const filtered = filterOrphanedToolMessages([])
      expect(filtered).toHaveLength(0)
    })

    it('should handle messages with no tool calls', () => {
      const humanMessage = new HumanMessage('Hello')
      const aiMessage = new AIMessage('Response without tools')

      const messages = [humanMessage, aiMessage]
      const filtered = filterOrphanedToolMessages(messages)

      expect(filtered).toHaveLength(2)
      expect(filtered).toContain(humanMessage)
      expect(filtered).toContain(aiMessage)
    })
  })

  describe('validateToolCallConsistency', () => {
    it('should return errors for orphaned ToolMessages', () => {
      const orphanedToolMessage = new ToolMessage({
        content: 'Orphaned response',
        tool_call_id: 'call_orphaned',
      })

      const errors = validateToolCallConsistency([orphanedToolMessage])
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('call_orphaned')
      expect(errors[0]).toContain('no corresponding tool call')
    })

    it('should return no errors for consistent tool calls', () => {
      const aiMessage = new AIMessage({
        content: 'Using tool',
        tool_calls: [{ id: 'call_123', name: 'tool', args: {} }],
      })
      const toolMessage = new ToolMessage({
        content: 'Tool response',
        tool_call_id: 'call_123',
      })

      const errors = validateToolCallConsistency([aiMessage, toolMessage])
      expect(errors).toHaveLength(0)
    })

    it('should return multiple errors for multiple orphaned ToolMessages', () => {
      const orphaned1 = new ToolMessage({
        content: 'Orphaned 1',
        tool_call_id: 'call_orphaned_1',
      })
      const orphaned2 = new ToolMessage({
        content: 'Orphaned 2',
        tool_call_id: 'call_orphaned_2',
      })

      const errors = validateToolCallConsistency([orphaned1, orphaned2])
      expect(errors).toHaveLength(2)
      expect(errors.some((e) => e.includes('call_orphaned_1'))).toBe(true)
      expect(errors.some((e) => e.includes('call_orphaned_2'))).toBe(true)
    })

    it('should handle empty messages array', () => {
      const errors = validateToolCallConsistency([])
      expect(errors).toHaveLength(0)
    })

    it('should handle mixed valid and invalid tool calls', () => {
      const aiMessage = new AIMessage({
        content: 'Using tool',
        tool_calls: [{ id: 'call_valid', name: 'tool', args: {} }],
      })
      const validToolMessage = new ToolMessage({
        content: 'Valid response',
        tool_call_id: 'call_valid',
      })
      const orphanedToolMessage = new ToolMessage({
        content: 'Orphaned response',
        tool_call_id: 'call_orphaned',
      })

      const errors = validateToolCallConsistency([
        aiMessage,
        validToolMessage,
        orphanedToolMessage,
      ])
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('call_orphaned')
    })
  })
})
