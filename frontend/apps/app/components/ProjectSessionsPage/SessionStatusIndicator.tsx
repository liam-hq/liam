'use client'

import {
  AlertTriangle,
  Check,
  Dot,
  Spinner,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import styles from './SessionStatusIndicator.module.css'

export type SessionStatus = 'running' | 'completed' | 'error' | 'idle'

type Props = {
  status: SessionStatus
}

const statusConfig = {
  running: {
    label: 'Running',
    className: styles.running,
    renderIcon: () => <Spinner size="16" />,
  },
  completed: {
    label: 'Completed',
    className: styles.completed,
    renderIcon: () => <Check size={16} />,
  },
  error: {
    label: 'Error',
    className: styles.error,
    renderIcon: () => <AlertTriangle size={16} />,
  },
  idle: {
    label: 'Idle',
    className: styles.idle,
    renderIcon: () => <Dot size={16} />,
  },
} as const

export const SessionStatusIndicator: FC<Props> = ({ status }) => {
  const config = statusConfig[status]

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <div className={clsx(styles.indicator, config.className)}>
            {config.renderIcon()}
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
