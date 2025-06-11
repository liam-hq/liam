'use client'

import {
  Tabs as FumadocsTabs,
  type TabsProps as FumadocsTabsProps,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'fumadocs-ui/components/tabs'
import type { ComponentProps, PropsWithChildren } from 'react'
import { CopyButton } from '../CopyButton'

type TabsProps = PropsWithChildren<FumadocsTabsProps>

export const Tabs = ({ children, ...props }: TabsProps) => {
  return (
    <FumadocsTabs {...props} defaultValue={props.items?.[0]} className="mb-5">
      <TabsList className="bg-fd-muted">
        {props.items?.map((item) => (
          <TabsTrigger key={item} value={item}>
            {item}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </FumadocsTabs>
  )
}

type TabProps = PropsWithChildren<ComponentProps<typeof TabsContent>> & {
  copyable?: boolean
}

export const Tab = ({ children, copyable, ...props }: TabProps) => {
  return (
    <TabsContent {...props} className="relative group">
      {children}
      {copyable && typeof children === 'string' && (
        <CopyButton
          onCopy={() => navigator.clipboard.writeText(children)}
          className="absolute top-3 right-3"
        />
      )}
    </TabsContent>
  )
}
