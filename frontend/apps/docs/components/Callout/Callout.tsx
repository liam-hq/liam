'use client'

import { AlertTriangle, Info, XCircle } from '@liam-hq/ui'
import type { FC, PropsWithChildren } from 'react'
import { match } from 'ts-pattern'
import { wrapperStyle } from "./Callout.style"

type Props = PropsWithChildren & {
  type?: 'info' | 'warn' | 'error'
  title: string
}

export const Callout: FC<Props> = ({ type = 'info', title, children }) => {
  const icon = match(type)
    .with('info', () => <Info className="w-5 h-5 text-fd-primary" />)
    .with('warn', () => <AlertTriangle className="w-5 h-5 text-warn" />)
    .with('error', () => <XCircle className="w-5 h-5 text-danger" />)
    .exhaustive()

  return (
    <div className={wrapperStyle({ type })}>
      {icon}
      <div className="grid gap-2">
        <span className="text-fd-card-foreground text-sm font-medium leading-5">
          {title}
        </span>
        <p className="text-fd-muted-foreground text-sm leading-5 m-0">
          {children}
        </p>
      </div>
    </div>
  )
}
