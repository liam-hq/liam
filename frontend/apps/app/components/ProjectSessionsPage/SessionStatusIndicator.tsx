'use client'

import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './SessionStatusIndicator.module.css'

export type SessionStatus = 'pending' | 'success' | 'error'

type Props = {
  status: SessionStatus
}

const statusConfig = {
  pending: {
    label: 'Running',
    className: styles.indicatorRunning,
  },
  success: {
    label: 'Completed',
    className: styles.indicatorCompleted,
  },
  error: {
    label: 'Error',
    className: styles.indicatorError,
    content: '!',
  },
} as const satisfies Record<
  SessionStatus,
  { label: string; className: string; content?: string }
>

export const SessionStatusIndicator: FC<Props> = ({ status }) => {
  const config = statusConfig[status]
  const content = 'content' in config ? config.content : null

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <div className={config.className} aria-hidden="true">
            {content}
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
