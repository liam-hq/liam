'use client'

import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
} from '@liam-hq/ui'
import type { FC } from 'react'
import type { Branch } from './BranchesDropdown'
import styles from './BranchesDropdown.module.css'
import { BranchRadioItem } from './BranchRadioItem'

type Props = {
  branches: Branch[]
  selectedBranchSha?: string
  onBranchChange: (sha: string) => void
}

export const Content: FC<Props> = ({
  branches,
  selectedBranchSha,
  onBranchChange,
}) => {
  const handleValueChange = (value: string) => {
    onBranchChange(value)
  }

  return (
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="start"
        sideOffset={5}
        className={styles.content}
      >
        <DropdownMenuRadioGroup
          value={selectedBranchSha || ''}
          onValueChange={handleValueChange}
        >
          <BranchRadioItem
            value=""
            label="No branch selected"
            showIcon={false}
          />
          {branches.map((branch) => (
            <BranchRadioItem
              key={branch.sha}
              value={branch.sha}
              label={branch.name}
              showIcon={true}
              isProtected={branch.protected}
            />
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  )
}
