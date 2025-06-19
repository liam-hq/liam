'use client'

import type { Database } from '@liam-hq/db'
import { syntaxCodeTagProps, syntaxCustomStyle, syntaxTheme } from '@liam-hq/ui'
import type { CSSProperties, FC, HTMLAttributes, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import { AgentMessage } from '@/components/Chat/AgentMessage'
import { UserMessage } from '@/components/Chat/UserMessage'
import { VersionMessage } from '@/components/Chat/VersionMessage'
import styles from './TimelineItem.module.css'

// Define CodeProps interface
interface CodeProps extends HTMLAttributes<HTMLElement> {
  node?: unknown
  inline?: boolean
  className?: string
  children?: ReactNode
  // Additional props that might be passed by react-markdown
  style?: CSSProperties
}

// TODO: Modify to use what is inferred from the valibot schema
export type TimelineItemProps =
  | {
      content: string
      role: Database['public']['Enums']['timeline_item_type_enum']
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
  | {
      id: string
      role: 'schema_version'
      content: string
      building_schema_version_id: string
    }

export const TimelineItem: FC<TimelineItemProps> = (props) => {
  // Handle schema_version role separately
  if ('building_schema_version_id' in props) {
    return (
      <div className={styles.messageContainer}>
        <VersionMessage
          buildingSchemaVersionId={props.building_schema_version_id}
        />
      </div>
    )
  }

  // Destructure props for regular messages
  const {
    content,
    role,
    timestamp,
    avatarSrc,
    avatarAlt,
    initial,
    isGenerating = false,
    children,
    progressMessages,
    showProgress,
  } = props

  // Only format and display timestamp if it exists
  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  // For bot messages, we'll render the markdown content with syntax highlighting
  const markdownContent =
    role !== 'user' ? (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props: CodeProps) {
            const { children, className, ...rest } = props
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
      {role === 'user' ? (
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
