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

const loadMessagesSchema = v.object({
  designSessionId: v.pipe(v.string(), v.uuid()),
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
 * Load messages for a design session (client-side)
 */
export const loadMessages = async (data: {
  designSessionId: string
}): Promise<{ success: boolean; messages?: Message[]; error?: string }> => {
  const parsedData = v.parse(loadMessagesSchema, data)
  const { designSessionId } = parsedData

  const supabase = createClient()

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('design_session_id', designSessionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load messages:', error)
    return { success: false, error: error.message }
  }

  return { success: true, messages: messages || [] }
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
    agentType: message.role === 'assistant' ? ('ask' as const) : undefined,
  }
}
