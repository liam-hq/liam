import { describe, expect, it } from 'vitest'
import type { ChatEntry } from '../types/chatTypes'
import { isDuplicateMessage } from './isDuplicateMessage'

describe('isDuplicateMessage', () => {
  const createChatEntry = (
    id: string,
    content: string,
    role: 'user' | 'assistant' = 'user',
    timestamp?: Date,
  ): ChatEntry => ({
    id,
    content,
    role,
    timestamp,
  })

  describe('ID-based duplicate detection', () => {
    it('should return true when message ID already exists', () => {
      const existingMessages = [
        createChatEntry('msg-1', 'Hello'),
        createChatEntry('msg-2', 'World'),
      ]
      const newMessage = createChatEntry('msg-1', 'Different content')

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(true)
    })

    it('should return false when message ID is unique', () => {
      const existingMessages = [
        createChatEntry('msg-1', 'Hello'),
        createChatEntry('msg-2', 'World'),
      ]
      const newMessage = createChatEntry('msg-3', 'New message')

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(false)
    })
  })

  describe('Content-based duplicate detection for user messages', () => {
    it('should return true for user messages with same content and no timestamps', () => {
      const existingMessages = [createChatEntry('msg-1', 'Hello world', 'user')]
      const newMessage = createChatEntry('msg-2', 'Hello world', 'user')

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(true)
    })

    it('should return false for user messages with different content', () => {
      const existingMessages = [createChatEntry('msg-1', 'Hello world', 'user')]
      const newMessage = createChatEntry('msg-2', 'Different message', 'user')

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(false)
    })

    it('should return false for non-user messages with same content', () => {
      const existingMessages = [
        createChatEntry('msg-1', 'Hello world', 'assistant'),
      ]
      const newMessage = createChatEntry('msg-2', 'Hello world', 'assistant')

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(false)
    })

    it('should return false when existing message is not user role', () => {
      const existingMessages = [
        createChatEntry('msg-1', 'Hello world', 'assistant'),
      ]
      const newMessage = createChatEntry('msg-2', 'Hello world', 'user')

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(false)
    })
  })

  describe('Timestamp tolerance logic', () => {
    it('should return true when timestamps are within 5 seconds', () => {
      const baseTime = new Date('2023-01-01T10:00:00Z')
      const closeTime = new Date('2023-01-01T10:00:03Z') // 3 seconds later

      const existingMessages = [
        createChatEntry('msg-1', 'Hello world', 'user', baseTime),
      ]
      const newMessage = createChatEntry(
        'msg-2',
        'Hello world',
        'user',
        closeTime,
      )

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(true)
    })

    it('should return false when timestamps are more than 5 seconds apart', () => {
      const baseTime = new Date('2023-01-01T10:00:00Z')
      const farTime = new Date('2023-01-01T10:00:06Z') // 6 seconds later

      const existingMessages = [
        createChatEntry('msg-1', 'Hello world', 'user', baseTime),
      ]
      const newMessage = createChatEntry(
        'msg-2',
        'Hello world',
        'user',
        farTime,
      )

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(false)
    })

    it('should handle negative time differences correctly', () => {
      const baseTime = new Date('2023-01-01T10:00:05Z')
      const earlierTime = new Date('2023-01-01T10:00:02Z') // 3 seconds earlier

      const existingMessages = [
        createChatEntry('msg-1', 'Hello world', 'user', baseTime),
      ]
      const newMessage = createChatEntry(
        'msg-2',
        'Hello world',
        'user',
        earlierTime,
      )

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(true)
    })

    it('should return true when one message has no timestamp', () => {
      const baseTime = new Date('2023-01-01T10:00:00Z')

      const existingMessages = [
        createChatEntry('msg-1', 'Hello world', 'user', baseTime),
      ]
      const newMessage = createChatEntry('msg-2', 'Hello world', 'user')

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(true)
    })

    it('should return true when both messages have no timestamp', () => {
      const existingMessages = [createChatEntry('msg-1', 'Hello world', 'user')]
      const newMessage = createChatEntry('msg-2', 'Hello world', 'user')

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should return false for empty message array', () => {
      const existingMessages: ChatEntry[] = []
      const newMessage = createChatEntry('msg-1', 'Hello world', 'user')

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(false)
    })

    it('should handle multiple existing messages correctly', () => {
      const existingMessages = [
        createChatEntry('msg-1', 'First message', 'user'),
        createChatEntry('msg-2', 'Second message', 'assistant'),
        createChatEntry('msg-3', 'Third message', 'user'),
      ]
      const newMessage = createChatEntry('msg-4', 'First message', 'user')

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(true)
    })

    it('should prioritize ID check over content check', () => {
      const existingMessages = [
        createChatEntry('msg-1', 'Original content', 'user'),
      ]
      const newMessage = createChatEntry(
        'msg-1',
        'Different content',
        'assistant',
      )

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(true)
    })

    it('should handle schema_version role messages', () => {
      const existingMessages = [
        {
          id: 'msg-1',
          role: 'schema_version' as const,
          content: 'Schema update',
          building_schema_version_id: 'version-1',
        },
      ]
      const newMessage = {
        id: 'msg-2',
        role: 'schema_version' as const,
        content: 'Schema update',
        building_schema_version_id: 'version-2',
      }

      expect(isDuplicateMessage(existingMessages, newMessage)).toBe(false)
    })
  })
})
