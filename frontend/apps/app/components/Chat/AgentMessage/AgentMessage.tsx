'use client'

import { syntaxCodeTagProps, syntaxCustomStyle } from '@liam-hq/ui'
import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import { BuildAgent } from '../AgentAvatar/BuildAgent'
import styles from './AgentMessage.module.css'

type AgentMessageState = 'default' | 'generating'

// Define CodeProps interface for markdown code blocks
type CodeProps = ComponentPropsWithoutRef<'code'> & {
  node?: unknown
  inline?: boolean
  className?: string
  children?: ReactNode
}

// Use an empty object for the style prop to avoid type errors
const emptyStyle = {}

type AgentMessageProps = {
  /**
   * The state of the message
   */
  state?: AgentMessageState
  /**
   * The message content (can be text or ReactNode for rich content)
   */
  message?: ReactNode
  /**
   * The timestamp to display
   */
  time?: string
  /**
   * The name of the agent to display
   */
  agentName?: string
  /**
   * Optional children to render below the message
   */
  children?: ReactNode
}

export const AgentMessage: FC<AgentMessageProps> = ({
  state = 'default',
  message = '',
  agentName,
  children,
}) => {
  const isGenerating = state === 'generating'

  return (
    <div className={styles.container}>
      <div className={styles.avatarContainer}>
        <BuildAgent />
        <span className={styles.agentName}>{agentName || 'Build Agent'}</span>
      </div>
      <div className={styles.contentContainer}>
        {isGenerating &&
        (!message || (typeof message === 'string' && message.trim() === '')) ? (
          <div
            className={`${styles.messageWrapper} ${styles.generatingContainer}`}
          >
            <span className={styles.generatingText}>Generating</span>
          </div>
        ) : (
          <div
            className={`${styles.messageWrapper} ${isGenerating ? styles.generatingContainer : ''}`}
          >
            <div className={styles.messageContent}>
              <span className={styles.messageText}>
                {typeof message === 'string' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code(props: CodeProps) {
                        const { children, className, ...rest } = props
                        const match = /language-(\w+)/.exec(className || '')
                        const isInline = !match && !className

                        return !isInline && match ? (
                          <SyntaxHighlighter
                            style={emptyStyle}
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
                    {message}
                  </ReactMarkdown>
                ) : (
                  message
                )}
              </span>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
