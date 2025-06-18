'use client'

import type { FC } from 'react'
import { DropdownMenuRoot, DropdownMenuTrigger } from '@/components'
import { Building, ChevronsUpDown } from '@/icons'
import type { Organization } from '../../services/getOrganization'
import type { OrganizationsByUserId } from '../../services/getOrganizationsByUserId'
import itemStyles from '../Item.module.css'
import { OrganizationDropdownContent } from './OrganizationDropdownContent'
import styles from './OrganizationItem.module.css'

type Props = {
  currentOrganization: Organization
  organizations: OrganizationsByUserId
}

export const OrganizationItem: FC<Props> = ({
  currentOrganization,
  organizations,
}) => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <div className={itemStyles.item}>
          <div className={itemStyles.iconContainer}>
            <Building />
          </div>
          <div className={itemStyles.labelArea}>
            <span className={itemStyles.label}>{currentOrganization.name}</span>
            <ChevronsUpDown className={styles.chevronIcon} />
          </div>
        </div>
      </DropdownMenuTrigger>
      <OrganizationDropdownContent
        currentOrganization={currentOrganization}
        organizations={organizations}
      />
    </DropdownMenuRoot>
  )
}
