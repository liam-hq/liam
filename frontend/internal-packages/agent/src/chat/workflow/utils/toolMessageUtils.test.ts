import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import { isMessageContentError, isToolMessageError } from './toolMessageUtils'

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
})
