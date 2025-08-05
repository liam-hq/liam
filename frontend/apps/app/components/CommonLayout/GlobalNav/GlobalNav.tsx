import { LayoutGrid, Settings } from '@liam-hq/ui'
import Link from 'next/link'
import type { FC } from 'react'
import { LiamLogoMark, LiamMigrationLogo } from '@/logos'
import type { Organization } from '../services/getOrganization'
import type { OrganizationsByUserId } from '../services/getOrganizationsByUserId'
import styles from './GlobalNav.module.css'
import itemStyles from './Item.module.css'
import { LinkItem } from './LinkItem'
import { NewSessionButton } from './NewSessionButton'
import { OrganizationItem } from './OrganizationItem'
import { RecentsSection } from './RecentsSection'

type Props = {
  currentOrganization: Organization | null
  organizations: OrganizationsByUserId | null
}

export const GlobalNav: FC<Props> = ({
  currentOrganization,
  organizations,
}) => {
  return (
    <div className={styles.globalNavContainer} data-global-nav-container>
      <nav className={styles.globalNav}>
        <div className={styles.logoContainer}>
          <Link
            href="/"
            className={styles.logoSection}
            aria-label="Go to Homepage"
          >
            <div className={itemStyles.iconContainer}>
              <LiamLogoMark />
            </div>
            <div className={itemStyles.labelArea}>
              <LiamMigrationLogo className={styles.liamMigrationLogo} />
            </div>
          </Link>
        </div>

        <div className={styles.navSection}>
          {currentOrganization && (
            <OrganizationItem
              currentOrganization={currentOrganization}
              organizations={organizations ?? []}
            />
          )}

          <LinkItem
            href="/app/projects"
            icon={<LayoutGrid />}
            label="Projects"
          />

          <NewSessionButton />
          <RecentsSection />
        </div>

        <div className={styles.footerSection}>
          <LinkItem
            href="/app/settings/general"
            icon={<Settings />}
            label="Settings"
          />
        </div>
      </nav>
    </div>
  )
}
