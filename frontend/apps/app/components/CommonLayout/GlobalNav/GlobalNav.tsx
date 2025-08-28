import {
  BaseGlobalNav,
  LayoutGrid,
  LiamDbLogo,
  LiamLogoMark,
  Settings,
} from '@liam-hq/ui'
import type { FC } from 'react'
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
    <BaseGlobalNav
      className={styles.globalNav}
      logoSection={
        <>
          <div className={itemStyles.iconContainer}>
            <LiamLogoMark />
          </div>
          <div className={itemStyles.labelArea}>
            <LiamDbLogo className={styles.liamMigrationLogo} />
          </div>
        </>
      }
      navContent={
        <>
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
        </>
      }
      footerContent={
        <LinkItem
          href="/app/settings/general"
          icon={<Settings />}
          label="Settings"
        />
      }
    />
  )
}
