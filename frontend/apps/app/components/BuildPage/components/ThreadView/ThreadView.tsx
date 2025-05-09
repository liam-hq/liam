import { type FC, useRef, useEffect } from 'react'
import { Button, Input } from '@liam-hq/ui'
import { ArrowLeft, Send } from 'lucide-react'
import styles from './ThreadView.module.css'
import type { Message, Thread } from '../../hooks/useERDChat'

interface ThreadViewProps {
  thread: Thread
  parentMessage: Message
  inputValue: string
  setInputValue: (value: string) => void
  sendReply: () => void
  closeThread: () => void
}

export const ThreadView: FC<ThreadViewProps> = ({
  thread,
  parentMessage,
  inputValue,
  setInputValue,
  sendReply,
  closeThread,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.messages])

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.container}>
      {/* Thread header */}
      <div className={styles.header}>
        <Button
          variant="ghost-secondary"
          size="sm"
          className={styles.backButton}
          onClick={closeThread}
        >
          <ArrowLeft className={styles.backIcon} />
          Back to chat
        </Button>
        <div className={styles.threadTitle}>Thread</div>
      </div>

      {/* Parent message */}
      <div className={styles.parentMessage}>
        <div className={styles.messageMeta}>
          {parentMessage.sender === 'human' ? 'You' : 'AI'} - {formatTime(parentMessage.timestamp)}
        </div>
        <div className={styles.messageContent}>{parentMessage.content}</div>
      </div>

      {/* Thread messages */}
      <div className={styles.messagesArea}>
        {thread.messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${
              message.sender === 'human' ? styles.humanMessage : styles.aiMessage
            }`}
          >
            <div className={styles.messageMeta}>
              {message.sender === 'human' ? 'You' : 'AI'} - {formatTime(message.timestamp)}
            </div>
            <div className={styles.messageContent}>{message.content}</div>
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
            sendReply()
          }}
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Reply to thread..."
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
