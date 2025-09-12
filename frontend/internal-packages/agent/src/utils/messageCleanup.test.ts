import { AIMessage, ChatMessage, HumanMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import {
  excludeOperationalMessages,
  removeReasoningFromMessage,
  removeReasoningFromMessages,
} from './messageCleanup'

describe('messageCleanup', () => {
  describe('removeReasoningFromMessage', () => {
    it('should remove reasoning field from AIMessage additional_kwargs', () => {
      const originalMessage = new AIMessage({
        content: 'Test content',
        additional_kwargs: {
          reasoning: 'Some reasoning data',
          other_field: 'Should be preserved',
        },
        response_metadata: { test: 'metadata' },
      })

      const cleanedMessage = removeReasoningFromMessage(originalMessage)

      expect(cleanedMessage).toBeInstanceOf(AIMessage)
      expect(cleanedMessage.content).toBe('Test content')
      expect(cleanedMessage.additional_kwargs).toEqual({
        other_field: 'Should be preserved',
      })
      expect(cleanedMessage.response_metadata).toEqual({ test: 'metadata' })
      expect('reasoning' in cleanedMessage.additional_kwargs).toBe(false)
    })

    it('should preserve tool_calls when removing reasoning', () => {
      const toolCalls = [
        {
          id: 'test-tool-call',
          name: 'test_tool',
          args: { param: 'value' },
        },
      ]

      const originalMessage = new AIMessage({
        content: 'Test content',
        additional_kwargs: {
          reasoning: 'Some reasoning data',
        },
        tool_calls: toolCalls,
      })

      const cleanedMessage = removeReasoningFromMessage(originalMessage)

      expect(cleanedMessage).toBeInstanceOf(AIMessage)
      if (cleanedMessage instanceof AIMessage) {
        expect(cleanedMessage.tool_calls).toEqual(toolCalls)
      }
      expect('reasoning' in cleanedMessage.additional_kwargs).toBe(false)
    })

    it('should preserve invalid_tool_calls and usage_metadata', () => {
      const invalidToolCalls = [{ id: 'invalid', error: 'test error' }]
      const usageMetadata = {
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
      }

      const originalMessage = new AIMessage({
        content: 'Test content',
        additional_kwargs: {
          reasoning: 'Some reasoning data',
        },
        invalid_tool_calls: invalidToolCalls,
        usage_metadata: usageMetadata,
      })

      const cleanedMessage = removeReasoningFromMessage(originalMessage)

      expect(cleanedMessage).toBeInstanceOf(AIMessage)
      if (cleanedMessage instanceof AIMessage) {
        expect(cleanedMessage.invalid_tool_calls).toEqual(invalidToolCalls)
        expect(cleanedMessage.usage_metadata).toEqual(usageMetadata)
      }
      expect('reasoning' in cleanedMessage.additional_kwargs).toBe(false)
    })

    it('should not modify AIMessage without reasoning field', () => {
      const originalMessage = new AIMessage({
        content: 'Test content',
        additional_kwargs: {
          other_field: 'Should be preserved',
        },
      })

      const cleanedMessage = removeReasoningFromMessage(originalMessage)

      expect(cleanedMessage).toBeInstanceOf(AIMessage)
      expect(cleanedMessage.additional_kwargs).toEqual({
        other_field: 'Should be preserved',
      })
    })

    it('should return non-AIMessage unchanged', () => {
      const humanMessage = new HumanMessage('Human message')
      const result = removeReasoningFromMessage(humanMessage)

      expect(result).toBe(humanMessage)
      expect(result).toBeInstanceOf(HumanMessage)
    })

    it('should handle AIMessage with empty additional_kwargs', () => {
      const originalMessage = new AIMessage({
        content: 'Test content',
        additional_kwargs: {},
      })

      const cleanedMessage = removeReasoningFromMessage(originalMessage)

      expect(cleanedMessage).toBeInstanceOf(AIMessage)
      expect(cleanedMessage.additional_kwargs).toEqual({})
    })
  })

  describe('removeReasoningFromMessages', () => {
    it('should process multiple messages correctly', () => {
      const messages = [
        new HumanMessage('Human message'),
        new AIMessage({
          content: 'AI response',
          additional_kwargs: {
            reasoning: 'Should be removed',
            other_field: 'Should be preserved',
          },
        }),
        new AIMessage({
          content: 'Another AI response',
          additional_kwargs: {
            no_reasoning: 'Should be preserved',
          },
        }),
      ]

      const cleanedMessages = removeReasoningFromMessages(messages)

      expect(cleanedMessages).toHaveLength(3)
      expect(cleanedMessages[0]).toBe(messages[0]) // HumanMessage unchanged
      expect(cleanedMessages[1]).toBeInstanceOf(AIMessage)
      if (cleanedMessages[1] instanceof AIMessage) {
        expect(cleanedMessages[1].additional_kwargs).toEqual({
          other_field: 'Should be preserved',
        })
      }
      expect(cleanedMessages[2]).toBeInstanceOf(AIMessage)
      if (cleanedMessages[2] instanceof AIMessage) {
        expect(cleanedMessages[2].additional_kwargs).toEqual({
          no_reasoning: 'Should be preserved',
        })
      }
    })

    it('should handle empty message array', () => {
      const result = removeReasoningFromMessages([])
      expect(result).toEqual([])
    })
  })

  describe('excludeOperationalMessages', () => {
    it('should exclude ChatMessage with operational role', () => {
      const messages = [
        new HumanMessage('User message'),
        new ChatMessage({
          content: 'Operational notification',
          role: 'operational',
          additional_kwargs: { messageType: 'info' },
        }),
        new AIMessage('AI response'),
      ]

      const filtered = excludeOperationalMessages(messages)

      expect(filtered).toHaveLength(2)
      expect(filtered[0]).toBeInstanceOf(HumanMessage)
      expect(filtered[1]).toBeInstanceOf(AIMessage)
      expect(
        filtered.find((m) => 'role' in m && m.role === 'operational'),
      ).toBeUndefined()
    })

    it('should exclude messages with messageType in additional_kwargs', () => {
      const messages = [
        new HumanMessage('User message'),
        new AIMessage({
          content: 'System notification',
          additional_kwargs: { messageType: 'error' },
        }),
        new AIMessage('Normal AI response'),
      ]

      const filtered = excludeOperationalMessages(messages)

      expect(filtered).toHaveLength(2)
      expect(filtered[0]).toBeInstanceOf(HumanMessage)
      expect(filtered[1]).toBeInstanceOf(AIMessage)
      expect(filtered[1]?.additional_kwargs).toEqual({})
    })

    it('should preserve non-operational messages', () => {
      const messages = [
        new HumanMessage('User message'),
        new AIMessage('AI response'),
        new ChatMessage({
          content: 'Assistant message',
          role: 'assistant',
        }),
      ]

      const filtered = excludeOperationalMessages(messages)

      expect(filtered).toHaveLength(3)
      expect(filtered).toEqual(messages)
    })

    it('should handle empty message array', () => {
      const filtered = excludeOperationalMessages([])
      expect(filtered).toEqual([])
    })

    it('should exclude multiple operational messages', () => {
      const messages = [
        new ChatMessage({
          content: 'Success notification',
          role: 'operational',
          additional_kwargs: { messageType: 'success' },
        }),
        new HumanMessage('User message'),
        new ChatMessage({
          content: 'Error notification',
          role: 'operational',
          additional_kwargs: { messageType: 'error' },
        }),
        new AIMessage('AI response'),
      ]

      const filtered = excludeOperationalMessages(messages)

      expect(filtered).toHaveLength(2)
      expect(filtered[0]).toBeInstanceOf(HumanMessage)
      expect(filtered[1]).toBeInstanceOf(AIMessage)
    })
  })
})
