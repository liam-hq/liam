import { type FC, memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Button } from '@liam-hq/ui'
import { MessageSquare, X } from 'lucide-react'
import styles from './ChatNode.module.css'
import type { Message } from '../../hooks/useERDChat'

interface ChatNodeData {
  entityId: string
  entityLabel: string
  messageContent: string
  timestamp: Date
  messageId: string
  threadId: string
  replyCount: number
  threadMessages: Message[]
  onViewThread: (threadId: string) => void
  onHideChatNode: (nodeId: string, threadId: string) => void
}

export const ChatNode: FC<NodeProps<ChatNodeData>> = memo(({ id, data }) => {
  const {
    entityLabel,
    messageContent,
    timestamp,
    threadId,
    replyCount,
    onViewThread,
    onHideChatNode,
  } = data

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.container}>
      {/* Connection handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
      />

      {/* Node header */}
      <div className={styles.header}>
        <div className={styles.entityLabel}>{entityLabel}</div>
        <Button
          variant="ghost-secondary"
          size="sm"
          className={styles.closeButton}
          onClick={() => onHideChatNode(id, threadId)}
        >
          <X className={styles.closeIcon} />
        </Button>
      </div>

      {/* Message content */}
      <div className={styles.content}>
        <div className={styles.messageTime}>{formatTime(timestamp)}</div>
        <div className={styles.messageContent}>{messageContent}</div>
      </div>

      {/* Thread info */}
      <div className={styles.footer}>
        <Button
          variant="ghost-secondary"
          size="sm"
          className={styles.threadButton}
          onClick={() => onViewThread(threadId)}
        >
          <MessageSquare className={styles.threadIcon} />
          {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        </Button>
      </div>
    </div>
  )
})

ChatNode.displayName = 'ChatNode'
