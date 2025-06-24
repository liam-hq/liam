'use client'

import {
  ArrowTooltipContent,
  ArrowTooltipPortal,
  ArrowTooltipProvider,
  ArrowTooltipRoot,
  ArrowTooltipTrigger,
} from '@liam-hq/ui'
import clsx from 'clsx'
import { Paperclip } from 'lucide-react'
import type { ComponentProps, Ref } from 'react'
import styles from './AttachButton.module.css'

type AttachButtonProps = ComponentProps<'button'> & {
  tooltipSide?: ComponentProps<typeof ArrowTooltipContent>['side']
  ref?: Ref<HTMLButtonElement>
}

export const AttachButton = ({
  tooltipSide = 'top',
  className,
  ref,
  ...props
}: AttachButtonProps) => {
  return (
    <ArrowTooltipProvider>
      <ArrowTooltipRoot>
        <ArrowTooltipTrigger asChild>
          <button
            ref={ref}
            type="button"
            className={clsx(
              styles.button,
              props.disabled && styles.disabled,
              className,
            )}
            {...props}
          >
            <Paperclip className={styles.icon} />
          </button>
        </ArrowTooltipTrigger>
        <ArrowTooltipPortal>
          <ArrowTooltipContent side={tooltipSide} sideOffset={8}>
            Attach Images, Files, etc.
          </ArrowTooltipContent>
        </ArrowTooltipPortal>
      </ArrowTooltipRoot>
    </ArrowTooltipProvider>
  )
}

AttachButton.displayName = 'AttachButton'
