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

export type SessionStatus = 'running' | 'idle'

type Props = {
  status: SessionStatus
}

const statusConfig = {
  running: {
    label: 'Running',
    className: styles.indicatorRunning,
  },
  idle: {
    label: 'Idle',
    className: styles.indicatorIdle,
  },
} as const

export const SessionStatusIndicator: FC<Props> = ({ status }) => {
  const config = statusConfig[status]

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <div className={config.className} />
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
