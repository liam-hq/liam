import { urlgen } from '@/libs/routes'
import Link from 'next/link'
import type { FC, ReactNode } from 'react'
import styles from './OrganizationsPage.module.css'
import { OrganizationsPageClient } from './OrganizationsPageClient'
import { getOrganizations } from './getOrganizations'

export const OrganizationsPage: FC<{
  children?: ReactNode
}> = async () => {
  const organizations = await getOrganizations()

  return (
    <div className={styles.container}>
      {/* Client component to handle sessionStorage toast */}
      <OrganizationsPageClient />

      <div className={styles.header}>
        <h1 className={styles.title}>Organizations</h1>
        <Link
          href={urlgen('organizations/new')}
          className={styles.createButton}
        >
          Create New Organization
        </Link>
      </div>

      {organizations === null || organizations.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No organizations found.</p>
          <p>Create a new organization to get started.</p>
        </div>
      ) : (
        <div className={styles.organizationGrid}>
          {organizations.map((organization) => (
            <Link
              key={organization.id}
              href={urlgen('projects')}
              className={styles.organizationCard}
            >
              <h2>{organization.name || 'Untitled Organization'}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
