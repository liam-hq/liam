import {
  ArrowTooltipContent,
  ArrowTooltipPortal,
  ArrowTooltipProvider,
  ArrowTooltipRoot,
  ArrowTooltipTrigger,
  Mic,
} from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC, MouseEventHandler, Ref } from 'react'
import { useState } from 'react'
import styles from './MicButton.module.css'

type MicButtonState = 'default' | 'hover' | 'active' | 'active-hover'

type MicButtonProps = {
  state?: MicButtonState
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
  'aria-label'?: string
  ref?: Ref<HTMLButtonElement>
}

export const MicButton: FC<MicButtonProps> = ({
  state: stateProp,
  onClick,
  className,
  'aria-label': ariaLabel = 'Voice Input',
  ref,
}) => {
  const [isActive, setIsActive] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  // If state is provided from props, use it. Otherwise, calculate based on internal state
  const state =
    stateProp ??
    (isActive
      ? isHovering
        ? 'active-hover'
        : 'active'
      : isHovering
        ? 'hover'
        : 'default')

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setIsActive(!isActive)
    onClick?.(e)
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  return (
    <ArrowTooltipProvider>
      <ArrowTooltipRoot>
        <ArrowTooltipTrigger asChild>
          <div
            className={clsx(styles.container, className)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {/* biome-ignore lint/a11y/useSemanticElements: div required for tooltip trigger wrapper */}
            role="button"
            tabIndex={-1}
          >
            <button
              ref={ref}
              className={clsx(styles.button, styles[`state-${state}`])}
              onClick={handleClick}
              aria-label={ariaLabel}
              type="button"
            >
              <div className={styles.iconWrapper}>
                <Mic className={styles.icon} size={16} />
              </div>
            </button>
          </div>
        </ArrowTooltipTrigger>
        <ArrowTooltipPortal>
          <ArrowTooltipContent side="top" align="center">
            Voice Input
          </ArrowTooltipContent>
        </ArrowTooltipPortal>
      </ArrowTooltipRoot>
    </ArrowTooltipProvider>
  )
}
