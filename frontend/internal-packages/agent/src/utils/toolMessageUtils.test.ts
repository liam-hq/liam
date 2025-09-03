import { HumanMessage, ToolMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import { isMessageContentError, isToolMessageError } from './toolMessageUtils'

describe('toolMessageUtils', () => {
  describe('isToolMessageError', () => {
    it('should return true for ToolMessage with error content', () => {
      const message = new ToolMessage({
        content: 'Database connection error occurred',
        tool_call_id: 'test-id',
      })
      expect(isToolMessageError(message)).toBe(true)
    })

    it('should return false for ToolMessage without error content', () => {
      const message = new ToolMessage({
        content: 'Operation completed successfully',
        tool_call_id: 'test-id',
      })
      expect(isToolMessageError(message)).toBe(false)
    })

    it('should return false for non-ToolMessage', () => {
      const message = new HumanMessage({
        content: 'Some error occurred',
      })
      expect(isToolMessageError(message)).toBe(false)
    })
  })

  describe('isMessageContentError', () => {
    it('should detect error in content', () => {
      expect(isMessageContentError('An error occurred')).toBe(true)
      expect(isMessageContentError('Multiple errors found')).toBe(true)
      expect(isMessageContentError('ERROR: Invalid input')).toBe(true)
    })

    it('should not detect error in normal content', () => {
      expect(isMessageContentError('Operation successful')).toBe(false)
      expect(isMessageContentError('No issues found')).toBe(false)
    })
  })
})
