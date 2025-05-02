'use client'

import { Avatar, AvatarWithImage } from '@liam-hq/ui'
import { Volume, Volume2 } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type AudioControl, speakAgentMessage } from '../../../../utils/tts'
import type { AgentType } from './ChatInput'
import styles from './ChatMessage.module.css'
import { BuildJackIcon } from './icons/BuildJackIcon'
import { FixJackIcon } from './icons/FixJackIcon'
import { LearnJackIcon } from './icons/LearnJackIcon'

export interface ChatMessageProps {
  content: string
  isUser: boolean
  timestamp?: Date
  className?: string
  avatarUrl?: string | null
  agentType?: AgentType
}

export const ChatMessage: FC<ChatMessageProps> = ({
  content,
  isUser,
  timestamp,
  className,
  avatarUrl,
  agentType = 'build',
}) => {
  // Managing audio playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioControl, setAudioControl] = useState<AudioControl | null>(null)

  // Audio playback toggle function
  const handleToggleSpeech = async () => {
    if (isPlaying && audioControl) {
      // Stop if currently playing
      audioControl.stop()
      setIsPlaying(false)
      setAudioControl(null)
      return
    }

    try {
      // Start audio playback
      setIsPlaying(true)
      const control = await speakAgentMessage(agentType, content)
      setAudioControl(control)

      // Process when playback completes
      control.onEnd = () => {
        setIsPlaying(false)
        setAudioControl(null)
      }
    } catch (error) {
      console.error('Failed to play speech:', error)
      setIsPlaying(false)
    }
  }

  // Only format and display timestamp if it exists
  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  // Function to render the appropriate agent avatar based on agent type
  const renderAgentAvatar = () => {
    // Force re-render when agent type changes
    const key = `avatar-${agentType}`

    switch (agentType) {
      case 'build':
        return (
          <BuildJackIcon key={key} size={24} className={styles.buildIcon} />
        )
      case 'review':
        return (
          <FixJackIcon key={key} size={24} className={styles.reviewerIcon} />
        )
      case 'learn':
        return (
          <LearnJackIcon key={key} size={24} className={styles.learnIcon} />
        )
      default:
        return (
          <BuildJackIcon key={key} size={24} className={styles.buildIcon} />
        )
    }
  }

  return (
    <div className={`${styles.messageContainer} ${className || ''}`}>
      <div className={styles.avatarContainer}>
        {isUser ? (
          // User avatar - show GitHub avatar if available, otherwise show default avatar
          avatarUrl ? (
            <AvatarWithImage src={avatarUrl} alt="User" size="sm" />
          ) : (
            <Avatar initial="U" size="sm" user="you" />
          )
        ) : (
          // Agent avatar - show the appropriate Jack icon based on agent type
          renderAgentAvatar()
        )}
      </div>
      <div className={styles.messageContent}>
        {isUser ? (
          <div className={styles.messageText}>{content}</div>
        ) : (
          <div className={styles.messageText}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>

            {/* Audio playback button (agent messages only) */}
            <button
              onClick={handleToggleSpeech}
              className={`${styles.speechButton} ${isPlaying ? styles.speechButtonActive : ''}`}
              aria-label={isPlaying ? 'Stop audio' : 'Read aloud'}
              type="button"
            >
              {isPlaying ? <Volume2 size={16} /> : <Volume size={16} />}
            </button>
          </div>
        )}
        {formattedTime && (
          <div className={styles.messageTime}>{formattedTime}</div>
        )}
      </div>
    </div>
  )
}
