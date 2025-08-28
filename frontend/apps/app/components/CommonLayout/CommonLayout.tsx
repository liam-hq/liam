import { BaseLayout } from '@liam-hq/ui'
import type { ReactNode } from 'react'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { AppBar } from './AppBar'
import { GlobalNav } from './GlobalNav'
import { OrgCookie } from './OrgCookie'
import { getAuthUser } from './services/getAuthUser'
import { getOrganization } from './services/getOrganization'
import { getOrganizationsByUserId } from './services/getOrganizationsByUserId'

type CommonLayoutProps = {
  projectId?: string
  branchOrCommit?: string
  children: ReactNode
}

export async function CommonLayout({
  projectId,
  branchOrCommit,
  children,
}: CommonLayoutProps) {
  const organizationId = await getOrganizationId()
  const { data: organization } = await getOrganization(organizationId)

  const { data: authUser, error } = await getAuthUser()
  if (error) {
    throw new Error('Authentication failed')
  }

  const { data: organizations } = await getOrganizationsByUserId(
    authUser.user.id,
  )

  return (
    <>
      {organization && <OrgCookie orgId={organization.id} />}
      <BaseLayout
        globalNav={
          <GlobalNav
            currentOrganization={organization}
            organizations={organizations}
          />
        }
        appBar={
          <AppBar
            currentProjectId={projectId}
            currentBranchOrCommit={branchOrCommit}
          />
        }
      >
        {children}
      </BaseLayout>
    </>
  )
}
