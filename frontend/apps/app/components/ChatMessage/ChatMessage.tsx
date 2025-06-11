'use client'

import { AgentMessage } from '@/components/Chat/AgentMessage'
import { UserMessage } from '@/components/Chat/UserMessage'
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
  content: string
  isUser: boolean
  timestamp?: Date
  avatarSrc?: string
  avatarAlt?: string
  initial?: string
  /**
   * Whether the bot is generating a response
   * @default false
   */
  isGenerating?: boolean
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
}

export const ChatMessage: FC<ChatMessageProps> = ({
  content,
  isUser,
  timestamp,
  avatarSrc,
  avatarAlt,
  initial,
  isGenerating = false,
  children,
  progressMessages,
  showProgress,
}) => {
  // Only format and display timestamp if it exists
  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  // For bot messages, we'll render the markdown content with syntax highlighting
  const markdownContent = !isUser ? (
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
      {content}
    </ReactMarkdown>
  ) : null

  return (
    <div className={styles.messageContainer}>
      {isUser ? (
        <UserMessage
          content={content}
          timestamp={timestamp}
          avatarSrc={avatarSrc}
          avatarAlt={avatarAlt}
          initial={initial}
        />
      ) : (
        <AgentMessage
          state={isGenerating ? 'generating' : 'default'}
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
