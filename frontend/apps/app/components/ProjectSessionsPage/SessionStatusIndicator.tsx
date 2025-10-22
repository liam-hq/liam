'use client'

import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import styles from './SessionStatusIndicator.module.css'

export type SessionStatus = 'running' | 'idle'

type Props = {
  status: SessionStatus
}

const statusConfig = {
  running: {
    label: 'Running',
    className: styles.running,
  },
  idle: {
    label: 'Idle',
    className: styles.idle,
  },
} as const

export const SessionStatusIndicator: FC<Props> = ({ status }) => {
  const config = statusConfig[status]

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <div className={clsx(styles.indicator, config.className)} />
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
