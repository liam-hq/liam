import { type FC, memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Button, Input } from '@liam-hq/ui'
import { Send, X } from 'lucide-react'
import styles from './ChatInputNode.module.css'

interface ChatInputNodeData {
  entityId: string
  entityLabel: string
  onSubmitMessage: (entityId: string, content: string, inputNodeId: string) => void
  onCancelInput: (nodeId: string) => void
}

export const ChatInputNode: FC<NodeProps<ChatInputNodeData>> = memo(({ id, data }) => {
  const { entityId, entityLabel, onSubmitMessage, onCancelInput } = data
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() === '') return
    
    onSubmitMessage(entityId, inputValue, id)
    setInputValue('')
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
          onClick={() => onCancelInput(id)}
        >
          <X className={styles.closeIcon} />
        </Button>
      </div>

      {/* Input form */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Comment on ${entityLabel}...`}
          className={styles.input}
        />
        <Button
          type="submit"
          size="sm"
          variant="solid-primary"
          className={styles.sendButton}
          disabled={inputValue.trim() === ''}
        >
          <Send className={styles.sendIcon} />
        </Button>
      </form>
    </div>
  )
})

ChatInputNode.displayName = 'ChatInputNode'
