'use client'

import type { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './ChatMessage.module.css'

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

    let match
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
  const customComponents = {
    pre: ({ children, ...props }: any) => {
      // Check if this is a JSON code block by examining the children
      const childProps = children?.props
      const language = childProps?.className?.replace('language-', '')
      const isJsonBlock = language === 'json' || !language

      // Try to parse as JSON to ensure it's valid
      let isValidJson = false
      try {
        if (isJsonBlock && childProps?.children) {
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
              onClick={() => copyToClipboard(childProps?.children || '')}
              aria-label="Copy to clipboard"
            >
              Copy
            </button>
          )}
          {isValidJson && onApplySchema && (
            <button
              type="button"
              className={styles.applyButton}
              onClick={() => onApplySchema(childProps.children)}
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className={styles.messageText}>
            {parts && parts.length > 0 ? (
              <>
                {parts.map((part) => {
                  if (part.type === 'text') {
                    return (
                      <ReactMarkdown
                        key={`text-part-${part.text?.substring(0, 20)}-${Math.random().toString(36).substring(2, 9)}`}
                        remarkPlugins={[remarkGfm]}
                        components={
                          onApplySchema ? customComponents : undefined
                        }
                      >
                        {part.text || ''}
                      </ReactMarkdown>
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={onApplySchema ? customComponents : undefined}
              >
                {content}
              </ReactMarkdown>
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
