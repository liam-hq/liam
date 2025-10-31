'use client'

import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import clsx from 'clsx'
import { X } from 'lucide-react'
import type { FC, ReactNode } from 'react'
import styles from './SessionStatusIndicator.module.css'

export type SessionStatus = 'running' | 'completed' | 'error'

type Props = {
  status: SessionStatus
}

const statusConfig = {
  running: {
    label: 'Running',
    className: styles.indicatorRunning,
  },
  completed: {
    label: 'Completed',
    className: styles.indicatorCompleted,
  },
  error: {
    label: 'Error',
    className: styles.indicatorError,
    content: <X className={clsx(styles.errorIcon)} aria-hidden="true" />,
  },
} as const satisfies Record<
  SessionStatus,
  { label: string; className: string; content?: ReactNode }
>

export const SessionStatusIndicator: FC<Props> = ({ status }) => {
  const config = statusConfig[status]
  const content = 'content' in config ? config.content : null

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <div className={styles.indicatorWrapper} aria-hidden="true">
            <div className={config.className}>{content}</div>
          </div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="top" sideOffset={4}>
            {config.label}
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  )
}
