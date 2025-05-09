import { type FC, useRef, useEffect } from 'react'
import { Button, Input } from '@liam-hq/ui'
import { MessageSquare, Send } from 'lucide-react'
import styles from './ChatInterface.module.css'
import type { Message } from '../../hooks/useERDChat'

interface ChatInterfaceProps {
  messages: Message[]
  inputValue: string
  setInputValue: (value: string) => void
  handleSendMessage: () => void
  startThread: (messageId: string) => void
  viewThread: (threadId: string) => void
}

export const ChatInterface: FC<ChatInterfaceProps> = ({
  messages,
  inputValue,
  setInputValue,
  handleSendMessage,
  startThread,
  viewThread,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.container}>
      {/* Messages area */}
      <div className={styles.messagesArea}>
        {messages.map((message) => (
          <div key={message.id} className={styles.messageWrapper}>
            {message.sender === 'system' ? (
              // Version notification
              <Button
                variant="outline-secondary"
                className={styles.versionNotification}
                onClick={() => message.versionId && console.log('Switch to version', message.versionId)}
              >
                {message.content} - {formatTime(message.timestamp)}
              </Button>
            ) : (
              // Human or AI message
              <div
                className={`${styles.message} ${
                  message.sender === 'human' ? styles.humanMessage : styles.aiMessage
                }`}
              >
                <div className={styles.messageHeader}>
                  <div className={styles.messageMeta}>
                    {message.sender === 'human' ? 'You' : 'AI'} - {formatTime(message.timestamp)}
                  </div>
                  <div className={styles.messageActions}>
                    {message.hasThread ? (
                      // View thread button
                      <Button
                        variant="ghost-secondary"
                        size="sm"
                        className={styles.threadButton}
                        onClick={() => message.threadId && viewThread(message.threadId)}
                      >
                        <MessageSquare className={styles.threadIcon} />
                        {message.threadRepliesCount} {message.threadRepliesCount === 1 ? 'reply' : 'replies'}
                      </Button>
                    ) : (
                      // Start thread button
                      <Button
                        variant="ghost-secondary"
                        size="sm"
                        className={styles.threadButton}
                        onClick={() => startThread(message.id)}
                      >
                        <MessageSquare className={styles.threadIcon} />
                        Reply in thread
                      </Button>
                    )}
                  </div>
                </div>
                <div className={styles.messageContent}>{message.content}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={styles.inputArea}>
        <form
          className={styles.inputForm}
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className={styles.input}
          />
          <Button type="submit" size="sm" className={styles.sendButton}>
            <Send className={styles.sendIcon} />
          </Button>
        </form>
      </div>
    </div>
  )
}
