import type { Tables } from '@liam-hq/db/supabase/database.types'
import { useCallback, useEffect, useState } from 'react'
import { WELCOME_MESSAGE } from '../constants/chatConstants'
import {
  convertMessageToChatEntry,
  setupRealtimeSubscription,
} from '../services'
import type { ChatEntry } from '../types/chatTypes'

export type Message = {
  id: string
  content: string
  role: 'user' | 'assistant'
  user_id: string | null
  created_at: string
  updated_at: string
  organization_id: string
  design_session_id: string
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
    messageUserId?: string | null,
  ) => void
}

export const useRealtimeMessages: UseRealtimeMessagesFunc = (
  designSession,
  currentUserId,
) => {
  // Initialize messages with welcome message and existing messages
  const initialMessages = [
    WELCOME_MESSAGE,
    ...designSession.messages.map((msg) => ({
      ...convertMessageToChatEntry(msg),
      dbId: msg.id,
    })),
  ]

  const [messages, setMessages] = useState<ChatEntry[]>(initialMessages)

  // Helper function to check if message already exists
  const messageExists = useCallback((messages: ChatEntry[], dbId: string) => {
    return messages.some((msg) => msg.dbId === dbId)
  }, [])

  // Helper function to update existing message by ID
  const updateExistingMessage = useCallback(
    (messages: ChatEntry[], newChatEntry: ChatEntry) => {
      const existingMessageIndex = messages.findIndex(
        (msg) => msg.id === newChatEntry.id,
      )

      if (existingMessageIndex >= 0) {
        const updated = [...messages]
        updated[existingMessageIndex] = newChatEntry
        return { updated, wasUpdated: true }
      }

      return { updated: messages, wasUpdated: false }
    },
    [],
  )

  // Helper function to handle optimistic updates for user messages
  const handleOptimisticUpdate = useCallback(
    (
      messages: ChatEntry[],
      newChatEntry: ChatEntry,
      messageUserId?: string | null,
    ) => {
      if (
        !newChatEntry.isUser ||
        messageUserId !== currentUserId ||
        !newChatEntry.dbId
      ) {
        return { updated: messages, wasUpdated: false }
      }

      const updated = messages.map((msg) => {
        // Find the most recent user message without a dbId and update it
        if (msg.isUser && !msg.dbId && msg.content === newChatEntry.content) {
          return { ...msg, dbId: newChatEntry.dbId }
        }
        return msg
      })

      // Check if we actually updated an existing message
      const wasUpdated = updated.some((msg, index) => msg !== messages[index])
      return { updated, wasUpdated }
    },
    [currentUserId],
  )

  // Add or update message with duplicate checking and optimistic update handling
  const addOrUpdateMessage = useCallback(
    (newChatEntry: ChatEntry, messageUserId?: string | null) => {
      setMessages((prev) => {
        // Check if message already exists by dbId to prevent duplicates
        if (newChatEntry.dbId && messageExists(prev, newChatEntry.dbId)) {
          return prev
        }

        // Check if we need to update an existing message by its temporary ID
        const { updated: updatedMessages, wasUpdated } = updateExistingMessage(
          prev,
          newChatEntry,
        )
        if (wasUpdated) {
          return updatedMessages
        }

        // Handle optimistic updates for user messages
        const { updated: optimisticUpdated, wasUpdated: optimisticWasUpdated } =
          handleOptimisticUpdate(prev, newChatEntry, messageUserId)
        if (optimisticWasUpdated) {
          return optimisticUpdated
        }

        // For new messages (AI messages from realtime or messages from other users), add them to the chat
        return [...prev, newChatEntry]
      })
    },
    [messageExists, updateExistingMessage, handleOptimisticUpdate],
  )

  // Handle new messages from realtime subscription
  const handleNewMessage = useCallback(
    (newMessage: Tables<'messages'>) => {
      // Convert database message to ChatEntry format
      const chatEntry = {
        ...convertMessageToChatEntry(newMessage),
        dbId: newMessage.id,
      }

      // TODO: Implement efficient duplicate checking - Use Set/Map for O(1) duplicate checking instead of O(n) array.some()
      // TODO: Implement smart auto-scroll - Consider user's scroll position and only auto-scroll when user is at bottom

      addOrUpdateMessage(chatEntry, newMessage.user_id)
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
