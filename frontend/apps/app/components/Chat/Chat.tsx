'use client'

import type { Schema } from '@liam-hq/db-structure'
import { type FC, useEffect, useRef, useState, useTransition } from 'react'
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
  const [messageCount, setMessageCount] = useState(0)
  const [lastMessageTime, setLastMessageTime] = useState(0)
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false)

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
  ])

  // Scroll to bottom when component mounts or messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Start AI response without saving user message (for auto-start scenarios)
  const startAIResponse = async (content: string) => {
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
  }

  const handleSendMessage = async (content: string) => {
    const now = Date.now()
    const timeWindow = 60000
    const maxMessages = 5

    if (now - lastMessageTime < timeWindow) {
      if (messageCount >= maxMessages) {
        setRateLimitExceeded(true)
        setTimeout(() => setRateLimitExceeded(false), 3000)
        return
      }
      setMessageCount(messageCount + 1)
    } else {
      setMessageCount(1)
      setLastMessageTime(now)
    }

    const userMessage: TimelineItemEntry = {
      id: generateTimelineItemId('user'),
      content,
      role: 'user',
      timestamp: new Date(),
      isGenerating: false,
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
      {rateLimitExceeded && (
        <div className={styles.rateLimitMessage}>
          Rate limit exceeded. Please wait before sending another message.
        </div>
      )}
    </div>
  )
}
