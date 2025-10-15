import Link from 'next/link'
import { urlgen } from '../../libs/routes'
import styles from './OrganizationsPage.module.css'
import { OrganizationsPageClient } from './OrganizationsPageClient'

type Organization = {
  id: string
  name: string | null
}

type Props = {
  organizations: Organization[] | null
  showToast?: boolean
}

export const OrganizationsPageView = ({
  organizations,
  showToast = false,
}: Props) => {
  return (
    <div className={styles.container}>
      {showToast && <OrganizationsPageClient />}

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
