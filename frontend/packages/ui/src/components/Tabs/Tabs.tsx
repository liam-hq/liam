'use client'

import { Content, List, Root, Trigger } from '@radix-ui/react-tabs'
import { type ComponentProps, forwardRef } from 'react'

export const TabsRoot = forwardRef<HTMLDivElement, ComponentProps<typeof Root>>(
  (props, ref) => {
    return <Root {...props} ref={ref} />
  },
)
TabsRoot.displayName = 'TabsRoot'

export const TabsList = forwardRef<HTMLDivElement, ComponentProps<typeof List>>(
  (props, ref) => {
    return <List {...props} ref={ref} />
  },
)
TabsList.displayName = 'TabsList'

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof Trigger>
>((props, ref) => {
  return <Trigger {...props} ref={ref} />
})
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof Content>
>(({ className, ...props }, ref) => {
  return <Content {...props} ref={ref} className={className} />
})
TabsContent.displayName = 'TabsContent'
