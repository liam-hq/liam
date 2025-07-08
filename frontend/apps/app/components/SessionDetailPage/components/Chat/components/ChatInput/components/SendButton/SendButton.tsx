'use client'

import { Button, CornerDownLeft } from '@liam-hq/ui'
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui/src/components/Tooltip'
import clsx from 'clsx'
import type { FC, MouseEvent } from 'react'
import styles from './SendButton.module.css'

interface SendButtonProps {
  hasContent: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
}

export const SendButton: FC<SendButtonProps> = ({
  hasContent,
  onClick,
  disabled = false,
}) => {
  return (
    <TooltipProvider>
      <TooltipRoot open={hasContent && !disabled ? undefined : false}>
        <TooltipTrigger asChild>
          <Button
            type="submit"
            disabled={!hasContent || disabled}
            className={clsx(
              styles.sendButton,
              hasContent && !disabled ? styles.canSend : styles.default,
            )}
            data-loading={hasContent && disabled ? 'true' : undefined}
            onClick={onClick}
          >
            <CornerDownLeft size={12} />
          </Button>
        </TooltipTrigger>
        {hasContent && !disabled && (
          <TooltipPortal>
            <TooltipContent side="top" sideOffset={4}>
              Send
            </TooltipContent>
          </TooltipPortal>
        )}
      </TooltipRoot>
    </TooltipProvider>
  )
}
