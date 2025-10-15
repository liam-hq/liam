'use client'

import type { BaseMessage } from '@langchain/core/messages'
import type { Schema } from '@liam-hq/schema'
import { useRouter, useSearchParams } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { OutputTabValue } from '../Output/constants'
import styles from './Chat.module.css'
import { ChatInput } from './components/ChatInput'
import { ErrorDisplay } from './components/ErrorDisplay'
import { Messages } from './components/Messages'
import { ScrollToBottomButton } from './components/ScrollToBottomButton'
import { WorkflowRunningIndicator } from './components/WorkflowRunningIndicator'
import { useScrollToBottom } from './useScrollToBottom'

type Props = {
  schemaData: Schema
  messages: BaseMessage[]
  onSendMessage: (content: string, isDeepModelingEnabled: boolean) => void
  isWorkflowRunning?: boolean
  error?: string | null
  onNavigate: (tab: OutputTabValue) => void
  initialIsDeepModelingEnabled?: boolean
}

export const Chat: FC<Props> = ({
  schemaData,
  messages,
  onSendMessage,
  isWorkflowRunning = false,
  onNavigate,
  error,
  initialIsDeepModelingEnabled = true,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { containerRef, scrollToBottom } = useScrollToBottom<HTMLDivElement>(
    messages.length,
  )
  const [showScrollButton, setShowScrollButton] = useState(false)

  const deepModelingParam = searchParams.get('deepModeling')
  const isDeepModelingEnabled =
    deepModelingParam === 'true' ||
    (deepModelingParam === null && initialIsDeepModelingEnabled)

  const recomputeScrollButton = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    // 48px (= --spacing-12): button 32px + spacing 16px; prevent flicker.
    setShowScrollButton(distance > 48)
  }, [containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    recomputeScrollButton()
    el.addEventListener('scroll', recomputeScrollButton)
    return () => el.removeEventListener('scroll', recomputeScrollButton)
  }, [containerRef, recomputeScrollButton])

  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute visibility on messages updates (streaming)
  useEffect(() => {
    recomputeScrollButton()
  }, [messages, recomputeScrollButton])

  const handleDeepModelingToggle = useCallback(
    (enabled: boolean) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('deepModeling', enabled.toString())
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const handleSendMessage = (content: string) => {
    onSendMessage(content, isDeepModelingEnabled)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messageListWrapper}>
        <div className={styles.messageList} ref={containerRef}>
          <Messages
            messages={messages}
            onNavigate={onNavigate}
            isWorkflowRunning={isWorkflowRunning}
          />
          {error && <ErrorDisplay error={error} />}
          {isWorkflowRunning && <WorkflowRunningIndicator />}
        </div>
        <ScrollToBottomButton
          visible={showScrollButton}
          onClick={scrollToBottom}
        />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        isWorkflowRunning={isWorkflowRunning}
        schema={schemaData}
        hasMessages={messages.length > 0}
        isDeepModelingEnabled={isDeepModelingEnabled}
        onDeepModelingToggle={handleDeepModelingToggle}
      />
    </div>
  )
}
