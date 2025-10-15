'use client'

import { BaseAppBar } from '@liam-hq/ui'
import type { FC } from 'react'
import { UserDropdown } from './UserDropdown'

type Props = {
  avatarUrl?: string | null
  userName?: string
  userEmail?: string | null
  breadcrumbsContent?: React.ReactNode
}

export const AppBarView: FC<Props> = ({
  avatarUrl,
  userName,
  userEmail,
  breadcrumbsContent,
}) => {
  return (
    <BaseAppBar
      leftContent={breadcrumbsContent}
      rightContent={
        <UserDropdown
          avatarUrl={avatarUrl}
          userName={userName}
          userEmail={userEmail}
        />
      }
    />
  )
}
