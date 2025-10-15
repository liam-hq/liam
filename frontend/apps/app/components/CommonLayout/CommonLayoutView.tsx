'use client'

import { BaseLayout } from '@liam-hq/ui'
import type { FC, ReactNode } from 'react'
import { AppBarView } from './AppBar/AppBarView'
import { GlobalNav } from './GlobalNav'
import type { Organization } from './services/getOrganization'
import type { OrganizationsByUserId } from './services/getOrganizationsByUserId'

type Props = {
  currentOrganization: Organization | null
  organizations: OrganizationsByUserId | null
  avatarUrl?: string | null
  userName?: string
  userEmail?: string | null
  children: ReactNode
}

export const CommonLayoutView: FC<Props> = ({
  currentOrganization,
  organizations,
  avatarUrl,
  userName,
  userEmail,
  children,
}) => {
  return (
    <BaseLayout
      globalNav={
        <GlobalNav
          currentOrganization={currentOrganization}
          organizations={organizations}
        />
      }
      appBar={
        <AppBarView
          avatarUrl={avatarUrl}
          userName={userName}
          userEmail={userEmail}
        />
      }
    >
      {children}
    </BaseLayout>
  )
}
