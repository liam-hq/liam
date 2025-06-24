'use client'

import { boolean, object, optional, parse, string } from 'valibot'
import { ERROR_MESSAGES } from '../constants/chatConstants'
import type { TimelineItemEntry } from '../types/chatTypes'
import { formatTimelineItemHistory } from './timelineItemHelpers'

type DesignSession = {
  id: string
  organizationId: string
  buildingSchemaId: string
  latestVersionNumber?: number
}

interface SendChatMessageParams {
  message: string
  timelineItems: TimelineItemEntry[]
  designSession: DesignSession
  currentUserId: string
}

interface SendChatMessageResult {
  success: boolean
  error?: string
}

/**
 * Schema for API response validation
 */
const ChatAPIResponseSchema = object({
  success: optional(boolean()),
  text: optional(string()),
  error: optional(string()),
})

/**
 * Calls the /api/chat endpoint with the given parameters
 */
const callChatAPI = async (
  message: string,
  history: [string, string][],
  designSession: DesignSession,
  currentUserId: string,
): Promise<Response> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
      organizationId: designSession.organizationId,
      buildingSchemaId: designSession.buildingSchemaId,
      latestVersionNumber: designSession.latestVersionNumber || 0,
      designSessionId: designSession.id,
      userId: currentUserId,
    }),
  })

  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.FETCH_FAILED)
  }

  return response
}

/**
 * Handles errors
 */
const handleChatError = (error: unknown): SendChatMessageResult => {
  console.error('Error in sendChatMessage:', error)

  return {
    success: false,
    error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL,
  }
}

/**
 * Sends a chat message to the API endpoint and handles the response
 * Messages are saved server-side and received via Supabase Realtime
 */
export const sendChatMessage = async ({
  message,
  timelineItems,
  designSession,
  currentUserId,
}: SendChatMessageParams): Promise<SendChatMessageResult> => {
  try {
    // Format timeline item history for API
    const history = formatTimelineItemHistory(timelineItems)

    // Call API
    const response = await callChatAPI(
      message,
      history,
      designSession,
      currentUserId,
    )

    // Parse JSON response with type safety
    const rawData = await response.json()
    const data = parse(ChatAPIResponseSchema, rawData)

    if (!data.success) {
      throw new Error(data.error || ERROR_MESSAGES.GENERAL)
    }

    return { success: true }
  } catch (error) {
    return handleChatError(error)
  }
}
