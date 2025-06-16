'use client'

import {
  Arrow,
  Content,
  Portal,
  Provider,
  Root,
  Trigger,
} from '@radix-ui/react-tooltip'
import { type ComponentProps, type FC, forwardRef } from 'react'
import styles from './ArrowTooltip.module.css'

type ArrowTooltipContentProps = ComponentProps<typeof Content> & {
  showArrow?: boolean
}

export const ArrowTooltipContent = forwardRef<
  HTMLDivElement,
  ArrowTooltipContentProps
>(({ showArrow = true, sideOffset = 5, children, ...props }, ref) => {
  return (
    <Content
      {...props}
      ref={ref}
      className={styles.content}
      sideOffset={sideOffset}
    >
      {children}
      {showArrow && <Arrow className={styles.arrow} width={6} height={3} />}
    </Content>
  )
})

ArrowTooltipContent.displayName = 'ArrowTooltipContent'

export const ArrowTooltipProvider: FC<ComponentProps<typeof Provider>> = ({
  children,
  ...props
}) => {
  return (
    <Provider delayDuration={100} {...props}>
      {children}
    </Provider>
  )
}

export const ArrowTooltipPortal = Portal
export const ArrowTooltipRoot = Root
export const ArrowTooltipTrigger = Trigger
