'use client'

import type { Tables } from '@liam-hq/db/supabase/database.types'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'
import type { ChatEntry } from '../types/chatTypes'

type SchemaVersionMessage = {
  id: string
  role: 'schema_version'
  content: string
  building_schema_version_id: string
}

// TODO: Modify to use what is inferred from the valibot schema
type Message = Tables<'messages'> | SchemaVersionMessage

// TODO: Make sure to use it when storing data and as an inferential type
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
function isSchemaVersionMessage(
  message: Message,
): message is SchemaVersionMessage {
  return (
    message.role === 'schema_version' &&
    'building_schema_version_id' in message &&
    typeof message.building_schema_version_id === 'string'
  )
}

export const convertMessageToChatEntry = (message: Message): ChatEntry => {
  if (isSchemaVersionMessage(message)) {
    // Schema version message
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      building_schema_version_id: message.building_schema_version_id,
    }
  }

  // Regular message from Tables<'messages'>
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
  onNewMessage: (message: Tables<'messages'>) => void,
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
