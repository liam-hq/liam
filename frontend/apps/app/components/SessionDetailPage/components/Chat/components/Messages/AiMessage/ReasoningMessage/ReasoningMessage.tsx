import {
  ChevronDown,
  ChevronRight,
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from '@liam-hq/ui'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { formatDuration } from '../../../../../../../../utils/formatDuration'
import { MarkdownContent } from '../../../../../../../MarkdownContent'
import { WorkflowRunningIndicator } from '../../../WorkflowRunningIndicator'
import styles from './ReasoningMessage.module.css'

type Props = {
  content: string
  isWorkflowRunning?: boolean
  durationMs?: number
}

export const ReasoningMessage: FC<Props> = ({
  content,
  isWorkflowRunning = false,
  durationMs,
}) => {
  const [isExpanded, setIsExpanded] = useState(isWorkflowRunning)
  const [isContentStreaming, setIsContentStreaming] =
    useState(isWorkflowRunning)

  // biome-ignore lint/correctness/useExhaustiveDependencies: content changes need to be tracked for streaming detection
  useEffect(() => {
    if (!isWorkflowRunning) {
      setIsContentStreaming(false)
      return
    }

    setIsContentStreaming(true)
    setIsExpanded(true)

    const timer = setTimeout(() => {
      setIsContentStreaming(false)
      setIsExpanded(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [content, isWorkflowRunning])

  return (
    <CollapsibleRoot
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={styles.container}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={styles.header}
          aria-expanded={isExpanded}
        >
          <span className={styles.chevron}>
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
          </span>
          <span className={styles.durationWrapper}>
            {isContentStreaming ? (
              <>
                <span className={styles.workedForText}>Reasoning</span>
                <WorkflowRunningIndicator size={4} />
              </>
            ) : durationMs !== undefined ? (
              <span className={styles.workedForText}>
                Reasoned for {formatDuration(durationMs)}
              </span>
            ) : (
              <span className={styles.workedForText}>Reasoned</span>
            )}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className={styles.content}>
        <MarkdownContent content={content} />
      </CollapsibleContent>
    </CollapsibleRoot>
  )
}
