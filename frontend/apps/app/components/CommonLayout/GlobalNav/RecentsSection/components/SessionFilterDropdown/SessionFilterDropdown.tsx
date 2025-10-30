'use client'

import {
  ChevronsUpDown,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Users,
} from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import itemStyles from '../../../Item.module.css'
import type { SessionFilterType } from '../../types'
import styles from './SessionFilterDropdown.module.css'

export type OrganizationMember = {
  id: string
  name: string
  email: string
}

type SessionFilterDropdownProps = {
  filterType: SessionFilterType
  organizationMembers: OrganizationMember[]
  currentUserId: string
  onFilterChange: (filterType: SessionFilterType) => void
}

const getFilterLabel = (
  filter: SessionFilterType,
  organizationMembers: OrganizationMember[],
) => {
  if (filter === 'all') return 'All Sessions'
  if (filter === 'me') return 'My Sessions'
  const member = organizationMembers.find((m) => m.id === filter)
  return member ? member.name : 'Unknown User'
}

export const SessionFilterDropdown: FC<SessionFilterDropdownProps> = ({
  filterType,
  organizationMembers,
  currentUserId,
  onFilterChange,
}) => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <div className={clsx(itemStyles.item, styles.filterItem)}>
          <div className={itemStyles.iconContainer}>
            <Users />
          </div>
          <div className={itemStyles.labelArea}>
            <span className={itemStyles.label}>
              {getFilterLabel(filterType, organizationMembers)}
            </span>
            <ChevronsUpDown className={styles.chevronIcon} />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={styles.dropdownContent}>
        <DropdownMenuRadioGroup
          value={filterType}
          onValueChange={(value) => onFilterChange(value)}
        >
          <DropdownMenuRadioItem value="me" label="My Sessions" />
          <DropdownMenuRadioItem value="all" label="All Sessions" />
          {organizationMembers.length > 1 && (
            <>
              <DropdownMenuSeparator />
              {organizationMembers
                .filter((member) => member.id !== currentUserId)
                .map((member) => (
                  <DropdownMenuRadioItem
                    key={member.id}
                    value={member.id}
                    label={member.name}
                  />
                ))}
            </>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  )
}
