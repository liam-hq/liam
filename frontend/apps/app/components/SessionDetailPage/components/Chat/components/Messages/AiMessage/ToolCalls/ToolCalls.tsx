import type { ToolMessage as ToolMessageType } from '@langchain/core/messages'
import type { FC } from 'react'
import type { ToolCalls as ToolCallsType } from '../../../../../../schema'
import { ToolCall } from './ToolCall'
import styles from './ToolCalls.module.css'

type Props = {
  toolCalls: ToolCallsType
  toolMessages: ToolMessageType[]
}

/**
 * TODO: Design Improvement
 *
 * ## Current Implementation
 * Displays tool calls made by AI during conversation with basic styling
 *
 * ## Areas for Enhancement
 * 1. Visual Design - Improve card appearance and spacing
 * 2. Icon System - Add specific icons for different tool types
 * 3. Argument Display - Better formatting for JSON arguments
 */
export const ToolCalls: FC<Props> = ({ toolCalls, toolMessages }) => {
  if (toolCalls.length === 0) return null

  return (
    <div className={styles.container}>
      {toolCalls.map((tc, _idx) => {
        const toolMessage = toolMessages.find(
          (msg) => msg.tool_call_id === tc.id,
        )
        if (!toolMessage) {
          return null
        }
        return <ToolCall key={tc.id} toolCall={tc} toolMessage={toolMessage} />
      })}
    </div>
  )
}
