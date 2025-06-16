import type { Database, Tables } from '@liam-hq/db/supabase/database.types'
import { useCallback, useEffect, useState } from 'react'
import {
  convertMessageToChatEntry,
  setupRealtimeSubscription,
} from '../services'
import type { ChatEntry } from '../types/chatTypes'

const isDuplicateMessage = (
  messages: ChatEntry[],
  newEntry: ChatEntry,
): boolean => {
  if (!newEntry.dbId) return false
  return messages.some((msg) => msg.dbId === newEntry.dbId)
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
  if (
    newEntry.role !== 'user' ||
    messageUserId !== currentUserId ||
    !newEntry.dbId
  ) {
    return null
  }

  const updated = messages.map((msg) => {
    if (msg.role === 'user' && !msg.dbId && msg.content === newEntry.content) {
      return { ...msg, dbId: newEntry.dbId }
    }
    return msg
  })

  const wasUpdated = updated.some((msg, index) => msg !== messages[index])
  return wasUpdated ? updated : null
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
    const chatEntry = convertMessageToChatEntry(msg)
    return {
      ...chatEntry,
      dbId: 'id' in msg ? msg.id : chatEntry.id,
    }
  })

  const [messages, setMessages] = useState<ChatEntry[]>(initialMessages)

  // Add or update message with duplicate checking and optimistic update handling
  const addOrUpdateMessage = useCallback(
    (newChatEntry: ChatEntry, messageUserId?: string | null) => {
      setMessages((prev) => {
        // Check if message already exists by dbId to prevent duplicates
        if (isDuplicateMessage(prev, newChatEntry)) {
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
    (newMessage: Tables<'timeline_items'>) => {
      // Convert database message to ChatEntry format
      const chatEntry = {
        ...convertMessageToChatEntry(newMessage),
        dbId: newMessage.id,
      }

      // TODO: Implement efficient duplicate checking - Use Set/Map for O(1) duplicate checking instead of O(n) array.some()
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
