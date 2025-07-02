'use client'

import {
  ArrowRight,
  ArrowTooltipContent,
  ArrowTooltipPortal,
  ArrowTooltipProvider,
  ArrowTooltipRoot,
  ArrowTooltipTrigger,
  Pause,
} from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC, MouseEvent } from 'react'
import styles from './ActionButton.module.css'

type ActionButtonProps = {
  hasContent: boolean
  isPending: boolean
  onSubmit: (e: MouseEvent<HTMLButtonElement>) => void
  onCancel: (e: MouseEvent<HTMLButtonElement>) => void
}

export const ActionButton: FC<ActionButtonProps> = ({
  hasContent,
  isPending,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className={styles.buttonContainer}>
      <ArrowTooltipProvider>
        <ArrowTooltipRoot>
          <ArrowTooltipTrigger asChild>
            <button
              type={isPending ? 'button' : 'submit'}
              disabled={!hasContent && !isPending}
              className={clsx(
                styles.actionButton,
                isPending && styles.isPending,
                hasContent && !isPending && styles.canSend,
                !hasContent && !isPending && styles.default,
              )}
              onClick={isPending ? onCancel : onSubmit}
            >
              <div className={styles.iconWrapper}>
                <ArrowRight
                  size={16}
                  className={clsx(
                    styles.sendIcon,
                    isPending && styles.sendIconHidden,
                  )}
                />
                <Pause
                  size={16}
                  className={clsx(
                    styles.cancelIcon,
                    !isPending && styles.cancelIconHidden,
                  )}
                />
              </div>
              <span
                className={clsx(styles.text, !isPending && styles.textHidden)}
              >
                Stop
              </span>
            </button>
          </ArrowTooltipTrigger>
          {hasContent && !isPending && (
            <ArrowTooltipPortal>
              <ArrowTooltipContent side="top" sideOffset={4}>
                Send
              </ArrowTooltipContent>
            </ArrowTooltipPortal>
          )}
        </ArrowTooltipRoot>
      </ArrowTooltipProvider>
    </div>
  )
}
