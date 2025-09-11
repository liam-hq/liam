'use client'

import type { ToolMessage as ToolMessageType } from '@langchain/core/messages'
import {
  Check,
  ChevronDown,
  ChevronRight,
  FoldVertical,
  UnfoldVertical,
  Wrench,
  X,
} from '@liam-hq/ui'
import { type FC, useMemo, useState } from 'react'
import type { ToolCalls } from '../../../../../../../schema'
import { ArgumentsDisplay } from './ArgumentsDisplay'
import { OperationsSummary } from './OperationsSummary'
import type { Operation } from './OperationsSummary/utils/parseOperations'
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
  const [isArgumentsExpanded, setIsArgumentsExpanded] = useState(false)
  const [needsExpandButton, setNeedsExpandButton] = useState(false)

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

  const handleToggleArgumentsExpand = () => {
    setIsArgumentsExpanded((prev) => !prev)
  }

  const handleArgumentsOverflow = (hasOverflow: boolean) => {
    setNeedsExpandButton(hasOverflow)
  }

  // Check if this tool should show operations summary
  const shouldShowOperations = useMemo(() => {
    const toolName = toolCall.name.toLowerCase()
    return (
      toolName.includes('operation') ||
      toolName.includes('modify') ||
      toolName.includes('update')
    )
  }, [toolCall.name])

  // Extract operations from arguments if available
  const operations = useMemo((): Operation[] => {
    if (!shouldShowOperations) return []

    // Type guard to check if an object has valid operations
    const hasValidOperations = (
      obj: unknown,
    ): obj is { operations: unknown[] } => {
      if (typeof obj !== 'object' || obj === null) {
        return false
      }
      const record = obj as Record<string, unknown>
      return 'operations' in obj && Array.isArray(record.operations)
    }

    // Type guard to validate individual operation
    const isValidOperation = (item: unknown): item is Operation => {
      if (typeof item !== 'object' || item === null) {
        return false
      }

      // Check if it has at least one of the expected operation fields
      const hasOpField = 'op' in item || 'type' in item
      if (!hasOpField) {
        return false
      }

      // Validate field types if present
      const record = item as Record<string, unknown>
      if ('op' in item && record.op !== undefined && typeof record.op !== 'string') {
        return false
      }
      if ('type' in item && record.type !== undefined && typeof record.type !== 'string') {
        return false
      }
      if ('path' in item && record.path !== undefined && typeof record.path !== 'string') {
        return false
      }

      return true
    }

    // Check if parsedArguments has valid operations
    if (!hasValidOperations(parsedArguments)) {
      return []
    }

    // Filter and validate each operation
    return parsedArguments.operations.filter(isValidOperation)
  }, [shouldShowOperations, parsedArguments])

  return (
    <div className={styles.container} data-collapsed={isCollapsed}>
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={!isCollapsed}
      >
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            {isCollapsed ? (
              <ChevronRight className={styles.chevron} size={16} />
            ) : (
              <ChevronDown className={styles.chevron} size={16} />
            )}
            <div className={styles.iconWrapper}>
              <Wrench className={styles.icon} size={16} />
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
        </div>
      </button>

      <div className={styles.content}>
        {/* Arguments display */}
        <div className={styles.argumentsBlock}>
          <div className={styles.argumentsHeader}>
            <span className={styles.argumentsTitle}>ARGUMENTS</span>
            {needsExpandButton && (
              <button
                className={styles.argumentsExpandButton}
                onClick={handleToggleArgumentsExpand}
                aria-label={
                  isArgumentsExpanded
                    ? 'Collapse arguments'
                    : 'Expand arguments'
                }
                type="button"
              >
                {isArgumentsExpanded ? (
                  <FoldVertical size={14} />
                ) : (
                  <UnfoldVertical size={14} />
                )}
              </button>
            )}
          </div>
          <ArgumentsDisplay
            args={parsedArguments}
            isExpanded={isArgumentsExpanded}
            onOverflowDetected={handleArgumentsOverflow}
            toolName={toolCall.name}
          />
        </div>

        {/* Operations summary display */}
        {shouldShowOperations && operations.length > 0 && (
          <div className={styles.operationsBlock}>
            <div className={styles.operationsHeader}>
              <span className={styles.operationsTitle}>OPERATIONS SUMMARY</span>
            </div>
            <OperationsSummary operations={operations} />
          </div>
        )}

        {/* Result display */}
        {hasResult && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <div className={styles.resultTitleWrapper}>
                <span className={styles.resultTitle}>RESULT</span>
                {isSuccess ? (
                  <Check className={styles.resultSuccessIcon} size={12} />
                ) : (
                  <X className={styles.resultErrorIcon} size={12} />
                )}
              </div>
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
    </div>
  )
}
