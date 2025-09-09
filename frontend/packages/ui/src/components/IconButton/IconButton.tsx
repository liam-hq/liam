'use client'

import clsx from 'clsx'
import type { ComponentProps, ReactNode, Ref } from 'react'
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
  ref?: Ref<HTMLButtonElement>
} & ComponentProps<'button'>

export const IconButton = ({
  icon,
  tooltipSide = 'bottom',
  tooltipContent,
  size = 'md',
  variant = 'default',
  children,
  ref,
  ...props
}: Props) => {
  const sizeClassName = match(size)
    .with('sm', () => styles.sm)
    .with('md', () => styles.md)
    .exhaustive()

  const variantClassName = match(variant)
    .with('default', () => '')
    .with('hoverBackground', () => styles.hoverBackground)
    .exhaustive()

  const { className, ...rest } = props

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            type="button"
            className={clsx(styles.iconWrapper, variantClassName, className)}
            {...rest}
          >
            <span className={clsx(styles.icon, sizeClassName)}>{icon}</span>
            {children && <span>{children}</span>}
          </button>
        </TooltipTrigger>
        {!props.disabled && (
          <TooltipPortal>
            <TooltipContent side={tooltipSide} sideOffset={4}>
              {tooltipContent}
            </TooltipContent>
          </TooltipPortal>
        )}
      </TooltipRoot>
    </TooltipProvider>
  )
}

IconButton.displayName = 'IconButton'
