import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import { isMessageContentError, isToolMessageError } from './toolMessageUtils'

describe('toolMessageUtils', () => {
  describe('isToolMessageError', () => {
    it('should return true for ToolMessage with error content', () => {
      const toolMessage = new ToolMessage({
        content: 'There was an error processing your request',
        tool_call_id: 'test-id',
      })

      expect(isToolMessageError(toolMessage)).toBe(true)
    })

    it('should return false for ToolMessage without error content', () => {
      const toolMessage = new ToolMessage({
        content: 'Operation completed successfully',
        tool_call_id: 'test-id',
      })

      expect(isToolMessageError(toolMessage)).toBe(false)
    })

    it('should return false for non-ToolMessage', () => {
      const humanMessage = new HumanMessage({
        content: 'There was an error in my request',
      })

      expect(isToolMessageError(humanMessage)).toBe(false)
    })

    it('should return false for AIMessage', () => {
      const aiMessage = new AIMessage({
        content: 'I encountered errors while processing',
      })

      expect(isToolMessageError(aiMessage)).toBe(false)
    })
  })

  describe('isMessageContentError', () => {
    it('should return true for content with "error"', () => {
      expect(isMessageContentError('There was an error')).toBe(true)
    })

    it('should return true for content with "errors"', () => {
      expect(isMessageContentError('Multiple errors occurred')).toBe(true)
    })

    it('should return true for case-insensitive error detection', () => {
      expect(isMessageContentError('ERROR: Something went wrong')).toBe(true)
      expect(isMessageContentError('ERRORS found in validation')).toBe(true)
    })

    it('should return false for content without error keywords', () => {
      expect(isMessageContentError('Operation completed successfully')).toBe(
        false,
      )
    })

    it('should return false for partial matches', () => {
      expect(isMessageContentError('errorless operation')).toBe(false)
      expect(isMessageContentError('terror alert')).toBe(false)
    })

    it('should handle empty string', () => {
      expect(isMessageContentError('')).toBe(false)
    })
  })
})
