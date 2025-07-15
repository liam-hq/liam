'use client'

import { boolean, object, optional, parse, string } from 'valibot'
import { ERROR_MESSAGES } from '../constants/chatConstants'

/**
 * Schema for API response validation
 */
const ChatAPIResponseSchema = object({
  success: optional(boolean()),
  text: optional(string()),
  error: optional(string()),
})

type ChatAPIRequestParams = {
  userInput: string
  designSessionId: string
}

/**
 * Calls the /api/chat endpoint with the given parameters
 */
const callChatAPI = async ({
  userInput,
  designSessionId,
}: ChatAPIRequestParams): Promise<Response> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userInput,
      history,
      designSessionId,
    }),
  })

  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.FETCH_FAILED)
  }

  return response
}

type SendChatMessageParams = {
  userInput: string
  designSessionId: string
}

type SendChatMessageResult = {
  success: boolean
  error?: string
}

/**
 * Sends a chat message to the API endpoint and handles the response
 * Messages are saved server-side and received via Supabase Realtime
 */
export const sendChatMessage = async ({
  userInput,
  designSessionId,
}: SendChatMessageParams): Promise<SendChatMessageResult> => {
  try {
    const response = await callChatAPI({
      userInput,
      designSessionId,
    })

    // Parse JSON response with type safety
    const rawData = await response.json()
    const data = parse(ChatAPIResponseSchema, rawData)

    if (!data.success) {
      throw new Error(data.error || ERROR_MESSAGES.GENERAL)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in sendChatMessage:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL,
    }
  }
}
