import type { Database, Tables } from '@liam-hq/db/supabase/database.types'
import { useCallback, useEffect, useState } from 'react'
import {
  convertMessageToChatEntry,
  setupRealtimeSubscription,
} from '../services'
import type { ChatEntry } from '../types/chatTypes'

interface MessageCache {
  messageIds: Set<string>
  userContentMap: Map<string, ChatEntry[]>
}

const createMessageCache = (messages: ChatEntry[]): MessageCache => {
  const messageIds = new Set<string>()
  const userContentMap = new Map<string, ChatEntry[]>()

  for (const msg of messages) {
    messageIds.add(msg.id)

    if (msg.role === 'user') {
      const existing = userContentMap.get(msg.content) || []
      existing.push(msg)
      userContentMap.set(msg.content, existing)
    }
  }

  return { messageIds, userContentMap }
}

const checkTimestampDuplicate = (
  existingMsg: ChatEntry,
  newEntry: ChatEntry,
): boolean => {
  const hasTimestamp = (
    msg: ChatEntry,
  ): msg is ChatEntry & { timestamp: Date } =>
    'timestamp' in msg && msg.timestamp instanceof Date

  const existingHasTimestamp = hasTimestamp(existingMsg)
  const newHasTimestamp = hasTimestamp(newEntry)

  // If both have timestamps, check if they're within reasonable range (5 seconds)
  if (existingHasTimestamp && newHasTimestamp) {
    const timeDiff = Math.abs(
      newEntry.timestamp.getTime() - existingMsg.timestamp.getTime(),
    )
    return timeDiff < 5000
  }

  // If either doesn't have timestamp, consider it a duplicate by content alone
  return true
}

const isDuplicateMessage = (
  messages: ChatEntry[],
  newEntry: ChatEntry,
  cache?: MessageCache,
): boolean => {
  const messageCache = cache || createMessageCache(messages)

  // Check by message ID - O(1) lookup
  if (messageCache.messageIds.has(newEntry.id)) {
    return true
  }

  // For user messages, check by content and role with timestamp tolerance
  if (newEntry.role === 'user') {
    const existingMessages = messageCache.userContentMap.get(newEntry.content)
    if (existingMessages) {
      return existingMessages.some((msg) =>
        checkTimestampDuplicate(msg, newEntry),
      )
    }
  }

  return false
}

const findExistingMessageIndex = (
  messages: ChatEntry[],
  newEntry: ChatEntry,
): number => {
  return messages.findIndex((msg) => msg.id === newEntry.id)
}

const updateExistingMessage = (
  messages: ChatEntry[],
  index: number,
  newEntry: ChatEntry,
): ChatEntry[] => {
  const updated = [...messages]
  updated[index] = newEntry
  return updated
}

const handleOptimisticUserUpdate = (
  messages: ChatEntry[],
  newEntry: ChatEntry,
  messageUserId: string | null | undefined,
  currentUserId: string | null | undefined,
): ChatEntry[] | null => {
  if (newEntry.role !== 'user' || messageUserId !== currentUserId) {
    return null
  }

  // Find optimistic message (user message with temporary ID) that matches content
  const optimisticIndex = messages.findIndex(
    (msg) =>
      msg.role === 'user' &&
      msg.content === newEntry.content &&
      msg.id !== newEntry.id,
  )

  if (optimisticIndex >= 0) {
    // Replace the optimistic message with the persisted one
    const updated = [...messages]
    updated[optimisticIndex] = newEntry
    return updated
  }

  return null
}

// TODO: Modify to use what is inferred from the valibot schema
export type Message =
  | {
      id: string
      content: string
      role: Database['public']['Enums']['message_role_enum']
      user_id: string | null
      created_at: string
      updated_at: string
      organization_id: string
      design_session_id: string
      building_schema_version_id: string | null
    }
  | {
      id: string
      role: 'schema_version'
      content: string
      building_schema_version_id: string
    }

type UseRealtimeMessagesFunc = (
  designSession: {
    id: string
    messages: Message[]
  },
  currentUserId?: string | null,
) => {
  messages: ChatEntry[]
  addOrUpdateMessage: (
    newChatEntry: ChatEntry,
    messageUserId?: string | null | undefined,
  ) => void
}

export const useRealtimeMessages: UseRealtimeMessagesFunc = (
  designSession,
  currentUserId,
) => {
  // Initialize messages with existing messages (no welcome message)
  const initialMessages = designSession.messages.map((msg) => {
    return convertMessageToChatEntry(msg)
  })

  const [messages, setMessages] = useState<ChatEntry[]>(initialMessages)

  // Add or update message with duplicate checking and optimistic update handling
  const addOrUpdateMessage = useCallback(
    (newChatEntry: ChatEntry, messageUserId?: string | null) => {
      setMessages((prev) => {
        const messageCache = createMessageCache(prev)

        // Check if message already exists to prevent duplicates
        if (isDuplicateMessage(prev, newChatEntry, messageCache)) {
          return prev
        }

        // Check if we need to update an existing message by its temporary ID
        // This handles streaming updates and other in-place updates
        const existingMessageIndex = findExistingMessageIndex(
          prev,
          newChatEntry,
        )
        if (existingMessageIndex >= 0) {
          return updateExistingMessage(prev, existingMessageIndex, newChatEntry)
        }

        // Handle optimistic updates for user messages
        const optimisticUpdate = handleOptimisticUserUpdate(
          prev,
          newChatEntry,
          messageUserId ?? null,
          currentUserId,
        )
        if (optimisticUpdate) {
          return optimisticUpdate
        }

        // For new messages (AI messages from realtime or messages from other users), add them to the chat
        return [...prev, newChatEntry]
      })
    },
    [currentUserId],
  )

  // Handle new messages from realtime subscription
  const handleNewMessage = useCallback(
    (newMessage: Tables<'messages'>) => {
      // Convert database message to ChatEntry format
      const chatEntry = convertMessageToChatEntry(newMessage)

      // TODO: Implement smart auto-scroll - Consider user's scroll position and only auto-scroll when user is at bottom

      addOrUpdateMessage(chatEntry, newMessage.user_id ?? null)
    },
    [addOrUpdateMessage],
  )

  // TODO: Implement comprehensive error handling - Add user notifications, retry logic, and distinguish between fatal/temporary errors
  const handleRealtimeError = useCallback((_error: Error) => {
    // TODO: Add user notification system and automatic retry mechanism
    // console.error('Realtime subscription error:', error)
  }, [])

  // TODO: Add network failure handling - Implement reconnection logic and offline message sync
  // TODO: Add authentication/authorization validation - Verify user permissions for realtime subscription
  // Set up realtime subscription for new messages
  useEffect(() => {
    if (currentUserId === null) {
      return
    }

    const subscription = setupRealtimeSubscription(
      designSession.id,
      handleNewMessage,
      handleRealtimeError,
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [designSession.id, currentUserId, handleNewMessage, handleRealtimeError])

  return {
    messages,
    addOrUpdateMessage,
  }
}
