import { layoutStyles } from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import { PublicAppBar } from './PublicAppBar'
import { PublicGlobalNav } from './PublicGlobalNav'

type Props = {
  children: ReactNode
}

export const PublicLayout: FC<Props> = ({ children }) => {
  return (
    <div className={clsx(layoutStyles.layout)}>
      <PublicGlobalNav />
      <div className={clsx(layoutStyles.mainContent)}>
        <PublicAppBar />
        <main className={clsx(layoutStyles.content)}>{children}</main>
      </div>
    </div>
  )
}
