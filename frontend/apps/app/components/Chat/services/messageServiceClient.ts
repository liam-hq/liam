'use client'

import { createClient } from '@/libs/db/client'
import type { Tables, TablesInsert } from '@liam-hq/db/supabase/database.types'
import * as v from 'valibot'

type Message = Tables<'messages'>
type MessageInsert = TablesInsert<'messages'>

const saveMessageSchema = v.object({
  designSessionId: v.pipe(v.string(), v.uuid()),
  content: v.pipe(v.string(), v.minLength(1)),
  role: v.picklist(['user', 'assistant']),
  userId: v.optional(v.nullable(v.pipe(v.string(), v.uuid()))),
})

// Schema for validating realtime message payload
const realtimeMessageSchema = v.object({
  id: v.string(),
  design_session_id: v.pipe(v.string(), v.uuid()),
  content: v.string(),
  role: v.picklist(['user', 'assistant']),
  user_id: v.nullable(v.string()),
  created_at: v.string(),
  updated_at: v.string(),
  organization_id: v.pipe(v.string(), v.uuid()),
})

/**
 * Save a message to the database (client-side)
 */
export const saveMessage = async (data: {
  designSessionId: string
  content: string
  role: 'user' | 'assistant'
  userId?: string | null
}): Promise<{ success: boolean; message?: Message; error?: string }> => {
  const parsedData = v.parse(saveMessageSchema, data)
  const { designSessionId, content, role, userId } = parsedData

  const supabase = createClient()
  const now = new Date().toISOString()

  // Get organization_id from design_session
  const { data: designSession, error: sessionError } = await supabase
    .from('design_sessions')
    .select('organization_id')
    .eq('id', designSessionId)
    .single()

  if (sessionError || !designSession) {
    console.error('Failed to get design session:', sessionError)
    return { success: false, error: 'Design session not found' }
  }

  const messageData: MessageInsert = {
    design_session_id: designSessionId,
    content,
    role,
    user_id: userId || null,
    updated_at: now,
    organization_id: designSession.organization_id,
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single()

  if (error) {
    console.error('Failed to save message:', JSON.stringify(error, null, 2))
    return { success: false, error: error.message }
  }

  return { success: true, message }
}

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
    isUser: message.role === 'user',
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
