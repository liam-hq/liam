import type { ToolMessage } from '@langchain/core/messages'
import type { ToolName } from '@liam-hq/agent/client'
import { Button } from '@liam-hq/ui'
import clsx from 'clsx'
import { Check, X } from 'lucide-react'
import { type FC, useCallback } from 'react'
import { match, P } from 'ts-pattern'
import type { OutputTabValue } from '../../../../../../../../Output/constants'
import { getToolDisplayInfo } from '../../utils/getToolDisplayInfo'
import styles from './Result.module.css'

type Props = {
  toolName: ToolName
  result?: ToolMessage
  onNavigate: (tab: OutputTabValue) => void
}

export const Result: FC<Props> = ({ toolName, result, onNavigate }) => {
  const { resultAction } = getToolDisplayInfo(toolName)

  const handleNavigateClick = useCallback(() => {
    if (!resultAction) return

    const tab = resultAction.type === 'erd' ? 'erd' : 'artifact'
    onNavigate(tab)
  }, [resultAction, onNavigate])

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className={styles.title}>Result</span>
          {match(result?.status)
            .with('success', () => (
              <Check
                className={clsx(styles.icon, styles.successIcon)}
                size={12}
              />
            ))
            .with('error', () => (
              <X className={clsx(styles.icon, styles.errorIcon)} size={12} />
            ))
            .with(P.nullish, () => null)
            .exhaustive()}
        </div>
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.content}>{result?.text}</div>
      </div>
      {resultAction && (
        <div className={styles.resultAction}>
          <Button
            size="sm"
            variant="outline-overlay"
            onClick={handleNavigateClick}
          >
            {resultAction.label}
          </Button>
        </div>
      )}
    </div>
  )
}
