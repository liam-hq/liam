'use client'

import type { ToolMessage as ToolMessageType } from '@langchain/core/messages'
import { Check, ChevronDown, ChevronRight, Wrench, X } from '@liam-hq/ui'
import { type FC, useState } from 'react'
import type { ToolCalls } from '../../../../../../../schema'
import styles from './ToolCallCard.module.css'
import { getToolDisplayInfo } from './utils/getToolDisplayInfo'
import { parseToolArguments } from './utils/parseToolArguments'

type ToolCallItem = ToolCalls[number]

type Props = {
  toolCall: ToolCallItem
  toolMessage?: ToolMessageType | undefined
}

export const ToolCallCard: FC<Props> = ({ toolCall, toolMessage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Parse arguments
  const parsedArguments = parseToolArguments(toolCall.args)

  // Get tool display info
  const toolInfo = getToolDisplayInfo(toolCall.name, parsedArguments)

  // Get result from tool message if available
  const result = toolMessage?.content
  const hasResult = result !== undefined && result !== null
  const isSuccess = hasResult && !toolMessage?.status?.includes('error')

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={!isCollapsed}
      >
        <div className={styles.headerLeft}>
          <div className={styles.iconWrapper}>
            <Wrench className={styles.icon} size={16} />
            {isCollapsed ? (
              <ChevronRight className={styles.chevron} size={16} />
            ) : (
              <ChevronDown className={styles.chevron} size={16} />
            )}
          </div>
          <div className={styles.titleWrapper}>
            <span className={styles.toolName}>{toolInfo.displayName}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          {hasResult &&
            (isSuccess ? (
              <Check className={styles.icon} size={16} />
            ) : (
              <X className={styles.icon} size={16} />
            ))}
        </div>
      </button>

      {!isCollapsed && (
        <div className={styles.content}>
          {/* Arguments display */}
          <div className={styles.arguments}>
            <div className={styles.argumentsHeader}>
              <span className={styles.argumentsTitle}>ARGUMENTS</span>
            </div>
            <div className={styles.content}>
              <pre className={styles.arguments}>
                {JSON.stringify(parsedArguments, null, 2)}
              </pre>
            </div>
          </div>

          {/* Result display */}
          {hasResult && (
            <div className={styles.result}>
              <div className={styles.resultHeader}>
                <span className={styles.resultTitle}>RESULT</span>
                {isSuccess ? (
                  <Check className={styles.resultSuccessIcon} size={12} />
                ) : (
                  <X className={styles.resultErrorIcon} size={12} />
                )}
              </div>
              <div className={styles.resultContent}>
                <pre className={styles.resultPre}>
                  {typeof result === 'string'
                    ? result
                    : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
