'use client'

import { AgentMessage } from '@/components/Chat/AgentMessage'
import { ErrorMessage } from '@/components/Chat/ErrorMessage'
import { UserMessage } from '@/components/Chat/UserMessage'
import type { ChatEntry } from '@/components/Chat/types/chatTypes'
import { syntaxCodeTagProps, syntaxCustomStyle, syntaxTheme } from '@liam-hq/ui'
import type React from 'react'
import type { FC, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import styles from './ChatMessage.module.css'

// Define CodeProps interface
interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  node?: unknown
  inline?: boolean
  className?: string
  children?: ReactNode
  // Additional props that might be passed by react-markdown
  style?: React.CSSProperties
}

export interface ChatMessageProps {
  /** Message entry with role information */
  message: ChatEntry
  /**
   * Optional children to render below the message content
   */
  children?: ReactNode
  /**
   * Progress messages to display above the main message
   */
  progressMessages?: string[]
  /**
   * Whether to show progress messages
   */
  showProgress?: boolean
  /**
   * Retry callback for error messages
   */
  onRetry?: (message: ChatEntry) => void
}

export const ChatMessage: FC<ChatMessageProps> = ({
  message,
  children,
  progressMessages,
  showProgress,
  onRetry,
}) => {
  // Handle error messages
  if (message.role === 'error') {
    return (
      <ErrorMessage
        message={message}
        onRetry={onRetry ? () => onRetry(message) : undefined}
      />
    )
  }

  // Only format and display timestamp if it exists
  const formattedTime = message.timestamp
    ? message.timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  // For bot messages, we'll render the markdown content with syntax highlighting
  const markdownContent = message.role === 'assistant' ? (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props: CodeProps) {
          const { children, className, node, ...rest } = props
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match && !className

          return !isInline && match ? (
            <SyntaxHighlighter
              // @ts-expect-error - syntaxTheme has a complex type structure that's compatible at runtime
              style={syntaxTheme}
              language={match[1]}
              PreTag="div"
              customStyle={syntaxCustomStyle}
              codeTagProps={syntaxCodeTagProps}
              {...rest}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...rest}>
              {children}
            </code>
          )
        },
      }}
    >
      {message.content}
    </ReactMarkdown>
  ) : null

  return (
    <div className={styles.messageContainer}>
      {message.role === 'user' ? (
        <UserMessage
          content={message.content}
          timestamp={message.timestamp}
          avatarSrc={message.avatarSrc}
          avatarAlt={message.avatarAlt}
          initial={message.initial}
        />
      ) : (
        <AgentMessage
          state={message.isGenerating ? 'generating' : 'default'}
          message={markdownContent}
          time={formattedTime || ''}
          progressMessages={progressMessages}
          showProgress={showProgress}
        >
          {children}
        </AgentMessage>
      )}
    </div>
  )
}
