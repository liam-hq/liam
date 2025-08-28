import { Wrench } from '@liam-hq/ui'
import type { FC } from 'react'
import type { ToolCalls as ToolCallsType } from '../../schema'
import styles from './ToolCalls.module.css'

type Props = {
  toolCalls: ToolCallsType
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
export const ToolCalls: FC<Props> = ({ toolCalls }) => {
  if (toolCalls.length === 0) return null

  return (
    <div className={styles.container}>
      <div className={styles.title}>Tool Calls ({toolCalls.length})</div>
      {toolCalls.map((tc, _idx) => {
        return (
          <div key={tc.id} className={styles.toolCall}>
            <div className={styles.toolCallTitle}>
              <Wrench className={styles.icon} />
              <p className={styles.functionName}>{tc.function.name}</p>
            </div>
            <div className={styles.args}>
              <span className={styles.argTitle}>ARGUMENTS</span>
              <code className={styles.argCode}>{tc.function.arguments}</code>
            </div>
          </div>
        )
      })}
    </div>
  )
}
