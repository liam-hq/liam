'use client'

import clsx from 'clsx'
import { type ComponentProps, type ReactNode, forwardRef } from 'react'
import { match } from 'ts-pattern'
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '../Tooltip'
import styles from './IconButton.module.css'

type Props = {
  icon: ReactNode
  tooltipSide?: ComponentProps<typeof TooltipContent>['side']
  tooltipContent: string
  size?: 'sm' | 'md'
  variant?: 'default' | 'hoverBackground'
} & ComponentProps<'button'>

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  (
    {
      icon,
      tooltipSide = 'bottom',
      tooltipContent,
      size = 'md',
      variant = 'default',
      children,
      ...props
    },
    ref,
  ) => {
    const sizeClassName = match(size)
      .with('sm', () => styles.sm)
      .with('md', () => styles.md)
      .exhaustive()

    const variantClassName = match(variant)
      .with('default', () => '')
      .with('hoverBackground', () => styles.hoverBackground)
      .exhaustive()
    return (
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <button
              ref={ref}
              type="button"
              className={clsx(styles.iconWrapper, variantClassName)}
              {...props}
            >
              <span className={clsx(styles.icon, sizeClassName)}>{icon}</span>
              {children && <span>{children}</span>}
            </button>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent side={tooltipSide} sideOffset={4}>
              {tooltipContent}
            </TooltipContent>
          </TooltipPortal>
        </TooltipRoot>
      </TooltipProvider>
    )
  },
)

IconButton.displayName = 'IconButton'
