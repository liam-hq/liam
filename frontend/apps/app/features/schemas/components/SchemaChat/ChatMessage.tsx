'use client'

import { marked } from 'marked'
import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react'
import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './ChatMessage.module.css'

// Parse markdown content into blocks
function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown)
  return tokens.map((token) => token.raw)
}

type ReactMarkdownComponentsType = ComponentPropsWithoutRef<
  typeof ReactMarkdown
>['components']

// Memoized markdown block component
const MemoizedMarkdownBlock = memo(
  ({
    content,
    components,
  }: { content: string; components?: ReactMarkdownComponentsType }) => {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.components === nextProps.components
    )
  },
)
MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock'

// Memoized markdown component that breaks content into blocks
const MemoizedMarkdown = memo(
  ({
    content,
    id,
    components,
    isStreaming = false,
  }: {
    content: string
    id: string
    components?: ReactMarkdownComponentsType
    isStreaming?: boolean
  }) => {
    const blocks = useMemo(() => {
      // ストリーミング中は軽量処理を使う
      if (isStreaming) {
        return [content] // シンプルに分割せずに処理
      }
      return parseMarkdownIntoBlocks(content)
    }, [content, isStreaming])

    return (
      <>
        {blocks.map((block, index) => {
          // indexをキーとして使用することを避けるため、ブロックの内容を一部使用
          const blockKey = `${id}-${block.substring(0, 10).replace(/\s+/g, '_')}-${index}`
          return (
            <MemoizedMarkdownBlock
              content={block}
              components={components}
              key={blockKey}
            />
          )
        })}
      </>
    )
  },
)
MemoizedMarkdown.displayName = 'MemoizedMarkdown'

interface MessagePart {
  type: string
  text?: string
  details?: Array<{
    type: string
    text?: string
    data?: string
    signature?: string
  }>
  reasoning?: string
}

export interface ChatMessageProps {
  content: string
  isUser: boolean
  timestamp?: Date
  parts?: MessagePart[]
  onApplySchema?: (jsonSchema: string) => void
}

export const ChatMessage: FC<ChatMessageProps> = ({
  content,
  isUser,
  timestamp,
  parts,
  onApplySchema,
}) => {
  // Format the timestamp only if it exists
  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  // Function to detect and extract JSON blocks from the content
  const _findJsonBlocks = (text: string) => {
    const jsonBlocks: { start: number; end: number; content: string }[] = []
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g

    let match: RegExpExecArray | null
    // eslint-disable-next-line no-cond-assign
    while ((match = codeBlockRegex.exec(text)) !== null) {
      jsonBlocks.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1].trim(),
      })
    }

    return jsonBlocks
  }

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showCopySuccess()
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Show a temporary success message when content is copied
  const showCopySuccess = () => {
    const toast = document.createElement('div')
    toast.textContent = 'Copied to clipboard'
    toast.style.position = 'fixed'
    toast.style.bottom = '20px'
    toast.style.left = '50%'
    toast.style.transform = 'translateX(-50%)'
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    toast.style.color = 'white'
    toast.style.padding = '8px 16px'
    toast.style.borderRadius = '4px'
    toast.style.zIndex = '9999'

    document.body.appendChild(toast)

    setTimeout(() => {
      document.body.removeChild(toast)
    }, 2000)
  }

  // Custom renderer for ReactMarkdown to add Apply button to JSON code blocks
  const customComponents: ReactMarkdownComponentsType = {
    // @ts-ignore - この型の不一致は無視する（ReactMarkdownの型定義の制限）
    pre: ({
      children,
      ...props
    }: { children?: ReactNode; [key: string]: unknown }) => {
      // Check if this is a JSON code block by examining the children
      const childProps =
        typeof children === 'object' && children && 'props' in children
          ? children.props
          : undefined
      const language =
        childProps &&
        typeof childProps === 'object' &&
        'className' in childProps
          ? String(childProps.className).replace('language-', '')
          : ''
      const isJsonBlock = language === 'json' || !language

      // Try to parse as JSON to ensure it's valid
      let isValidJson = false
      try {
        if (
          isJsonBlock &&
          childProps &&
          'children' in childProps &&
          typeof childProps.children === 'string'
        ) {
          JSON.parse(childProps.children)
          isValidJson = true
        }
      } catch (_e) {
        isValidJson = false
      }

      return (
        <pre {...props} className={isJsonBlock ? styles.jsonCodeBlock : ''}>
          {children}
          {isJsonBlock && (
            <button
              type="button"
              className={styles.copyButton}
              onClick={() => {
                const content =
                  childProps &&
                  'children' in childProps &&
                  typeof childProps.children === 'string'
                    ? childProps.children
                    : ''
                copyToClipboard(content)
              }}
              aria-label="Copy to clipboard"
            >
              Copy
            </button>
          )}
          {isValidJson && onApplySchema && (
            <button
              type="button"
              className={styles.applyButton}
              onClick={() => {
                if (
                  childProps &&
                  'children' in childProps &&
                  typeof childProps.children === 'string'
                ) {
                  onApplySchema(childProps.children)
                }
              }}
            >
              Apply
            </button>
          )}
        </pre>
      )
    },
  }

  return (
    <div
      className={`${styles.messageContainer} ${
        isUser ? styles.userMessage : styles.botMessage
      }`}
    >
      <div className={styles.messageContent}>
        {isUser ? (
          <div className={styles.messageText}>
            <MemoizedMarkdown
              content={content}
              id={`user-message-${content.substring(0, 20)}`}
            />
          </div>
        ) : (
          <div className={styles.messageText}>
            {parts && parts.length > 0 ? (
              <>
                {parts.map((part) => {
                  if (part.type === 'text') {
                    return (
                      <MemoizedMarkdown
                        key={`text-part-${part.text?.substring(0, 20)}`}
                        content={part.text || ''}
                        id={`part-${part.text?.substring(0, 20)}`}
                        components={
                          onApplySchema ? customComponents : undefined
                        }
                        isStreaming={(part.text?.length || 0) > 500}
                      />
                    )
                  }

                  if (part.type === 'reasoning') {
                    return (
                      <div
                        key={`reasoning-part-${Math.random().toString(36).substring(2, 9)}`}
                        className={styles.reasoning}
                      >
                        {part.details?.map((detail) =>
                          detail.type === 'text' ? (
                            <div
                              key={`detail-text-${detail.text?.substring(0, 10) || ''}-${Math.random().toString(36).substring(2, 9)}`}
                            >
                              {detail.text || ''}
                            </div>
                          ) : (
                            <div
                              key={`detail-redacted-${Math.random().toString(36).substring(2, 9)}`}
                            >
                              &lt;redacted&gt;
                            </div>
                          ),
                        )}
                      </div>
                    )
                  }

                  return null
                })}
              </>
            ) : (
              <MemoizedMarkdown
                content={content}
                id={`message-${content.substring(0, 20)}`}
                components={onApplySchema ? customComponents : undefined}
                isStreaming={content.length > 500}
              />
            )}
          </div>
        )}
        {formattedTime && (
          <div className={styles.messageTime}>{formattedTime}</div>
        )}
      </div>
    </div>
  )
}
