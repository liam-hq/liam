'use client'

import type { Schema } from '@liam-hq/db-structure'
import { type FC, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { ChatInput } from '../ChatInput'
import { TimelineItem } from '../TimelineItem'
import styles from './Chat.module.css'
import { useAutoStartExecuted } from './hooks/useAutoStartExecuted'
import {
  type TimelineItemType,
  useRealtimeTimelineItems,
} from './hooks/useRealtimeTimelineItems'
import { getCurrentUserId } from './services'
import { sendChatMessage } from './services/aiMessageService'
import { generateTimelineItemId } from './services/timelineItemHelpers'
import type { TimelineItemEntry } from './types/chatTypes'

type DesignSession = {
  id: string
  organizationId: string
  timelineItems: TimelineItemType[]
  buildingSchemaId: string
  latestVersionNumber?: number
}

interface Props {
  schemaData: Schema
  designSession: DesignSession
}

export const Chat: FC<Props> = ({ schemaData, designSession }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { timelineItems: realtimeTimelineItems, addOrUpdateTimelineItem } =
    useRealtimeTimelineItems(designSession, currentUserId)
  const [isLoading, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { autoStartExecuted, setAutoStartExecuted } = useAutoStartExecuted(
    designSession.id,
  )

  // Get current user ID on component mount
  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getCurrentUserId()
      setCurrentUserId(userId)
    }
    fetchUserId()
  }, [])

  // Auto-start AI response for initial user message
  useEffect(() => {
    if (!currentUserId || autoStartExecuted || isLoading) return

    // Only auto-start if there's exactly one timeline item and it's from user
    if (
      realtimeTimelineItems.length === 1 &&
      realtimeTimelineItems[0].role === 'user'
    ) {
      const initialTimelineItem = realtimeTimelineItems[0]
      setAutoStartExecuted(true)
      startTransition(() => {
        startAIResponse(initialTimelineItem.content)
      })
    }
  }, [
    currentUserId,
    isLoading,
    realtimeTimelineItems,
    autoStartExecuted,
    setAutoStartExecuted,
    startAIResponse,
  ])

  // Scroll to bottom when component mounts or messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Start AI response without saving user message (for auto-start scenarios)
  const startAIResponse = useCallback(async (content: string) => {
    if (!currentUserId) return

    // Send chat message to API
    const result = await sendChatMessage({
      message: content,
      timelineItems: realtimeTimelineItems,
      designSession,
      currentUserId,
    })

    if (result.success) {
      // Scroll to bottom after successful completion
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 10)
    }
  }, [currentUserId, realtimeTimelineItems, designSession])

  // TODO: Add rate limiting - Implement rate limiting for message sending to prevent spam
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: TimelineItemEntry = {
      id: generateTimelineItemId('user'),
      content,
      role: 'user',
      timestamp: new Date(),
      isGenerating: false, // Explicitly set to false for consistency
    }
    addOrUpdateTimelineItem(userMessage)

    startTransition(() => {
      startAIResponse(content)
    })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messagesContainer}>
        {/* Display all timeline items */}
        {realtimeTimelineItems.map((timelineItem) => (
          <TimelineItem key={timelineItem.id} {...timelineItem} />
        ))}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        schema={schemaData}
      />
    </div>
  )
}
