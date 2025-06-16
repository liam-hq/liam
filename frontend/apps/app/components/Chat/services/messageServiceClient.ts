'use client'

import { createClient } from '@/libs/db/client'
import type { Tables } from '@liam-hq/db/supabase/database.types'
import * as v from 'valibot'

type Message = Tables<'messages'>

// Schema for validating realtime message payload
const realtimeMessageSchema = v.object({
  id: v.string(),
  design_session_id: v.pipe(v.string(), v.uuid()),
  content: v.string(),
  role: v.picklist(['user', 'assistant', 'schema_version']),
  user_id: v.nullable(v.string()),
  created_at: v.string(),
  updated_at: v.string(),
  organization_id: v.pipe(v.string(), v.uuid()),
  building_schema_version_id: v.nullable(v.string()),
})

/**
 * Get current user ID from Supabase auth
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Failed to get current user:', error)
    return null
  }

  return user?.id || null
}

/**
 * Convert database message to ChatEntry format
 */
export const convertMessageToChatEntry = (message: Message) => {
  return {
    id: message.id,
    content: message.content,
    role: message.role,
    timestamp: new Date(message.created_at),
    isGenerating: false,
  }
}

/**
 * Set up realtime subscription for messages in a design session
 */
export const setupRealtimeSubscription = (
  designSessionId: string,
  onNewMessage: (message: Message) => void,
  onError?: (error: Error) => void,
) => {
  const supabase = createClient()

  const subscription = supabase
    .channel(`messages:${designSessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `design_session_id=eq.${designSessionId}`,
      },
      (payload) => {
        try {
          const validatedMessage = v.parse(realtimeMessageSchema, payload.new)
          onNewMessage(validatedMessage)
        } catch (error) {
          onError?.(
            error instanceof Error
              ? error
              : new Error('Invalid message format or validation failed'),
          )
        }
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
      } else if (status === 'CHANNEL_ERROR') {
        onError?.(new Error('Realtime subscription failed'))
      }
    })

  return subscription
}
