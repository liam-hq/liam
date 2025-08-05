import type { ReactNode } from 'react'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { AppBar } from './AppBar'
import styles from './CommonLayout.module.css'
import { GlobalNav } from './GlobalNav'
import { OrgCookie } from './OrgCookie'
import { getAuthUser } from './services/getAuthUser'
import { getOrganization } from './services/getOrganization'
import { getOrganizationsByUserId } from './services/getOrganizationsByUserId'

type CommonLayoutProps = {
  projectId?: string
  branchOrCommit?: string
  designSessionId?: string
  children: ReactNode
}

export async function CommonLayout({
  projectId,
  branchOrCommit,
  designSessionId,
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
    <div className={styles.layout}>
      {organization && <OrgCookie orgId={organization.id} />}
      <GlobalNav
        currentOrganization={organization}
        organizations={organizations}
      />
      <div className={styles.mainContent}>
        <AppBar
          currentProjectId={projectId}
          currentBranchOrCommit={branchOrCommit}
          designSessionId={designSessionId}
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
