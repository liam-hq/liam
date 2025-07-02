'use client'

import { Button } from '@liam-hq/ui'
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui/src/components/Tooltip'
import clsx from 'clsx'
import { Pause } from 'lucide-react'
import type { FC, MouseEvent } from 'react'
import styles from './CancelButton.module.css'

export interface CancelButtonProps {
  hasContent: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
}

export const CancelButton: FC<CancelButtonProps> = ({
  hasContent,
  onClick,
  disabled = false,
}) => {
  if (!hasContent) {
    return (
      <Button
        type="submit"
        disabled={disabled}
        className={clsx(styles.cancelButton, styles.default)}
        onClick={onClick}
      >
        <Pause size={12} />
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button
            type="submit"
            disabled={disabled}
            className={clsx(styles.cancelButton, styles.canCancel)}
            data-loading={disabled ? 'true' : undefined}
            onClick={onClick}
          >
            <Pause size={12} />
          </Button>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="top" sideOffset={4}>
            Cancel
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  )
}
