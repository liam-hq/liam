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
  disabled?: boolean
}

export const MicButton: FC<MicButtonProps> = ({
  state: stateProp,
  onClick,
  className,
  'aria-label': ariaLabel = 'Voice Input',
  ref,
  disabled = false,
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
    if (disabled) return
    setIsActive(!isActive)
    onClick?.(e)
  }

  const handleMouseEnter = () => {
    if (disabled) return
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    if (disabled) return
    setIsHovering(false)
  }

  return (
    <ArrowTooltipProvider>
      <ArrowTooltipRoot>
        <ArrowTooltipTrigger asChild>
          <div
            className={clsx(styles.container, className)}
            role="group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              ref={ref}
              className={clsx(
                styles.button,
                styles[`state-${state}`],
                disabled && styles.disabled,
              )}
              onClick={handleClick}
              aria-label={ariaLabel}
              type="button"
              disabled={disabled}
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
