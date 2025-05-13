'use client'

import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components'
import { urlgen } from '@/libs/routes'
import { useRouter } from 'next/navigation'
import { type FC, useCallback } from 'react'
import styles from './BranchDropdownMenu.module.css'
import type { Branch } from './services/getBranches'

type ContentProps = {
  currentBranch: Branch
  branches: Branch[]
  currentProjectId: string
}

export const Content: FC<ContentProps> = ({
  currentBranch,
  branches,
  currentProjectId,
}) => {
  const router = useRouter()

  const handleChangeBranch = useCallback(
    (branchOrCommit: string) => {
      router.push(
        // TODO: Replace the current path's :branchOrCommit with the selected branchOrCommit and navigate to that path
        urlgen('projects/[projectId]/ref/[branchOrCommit]', {
          projectId: currentProjectId,
          branchOrCommit,
        }),
      )
    },
    [currentProjectId, router],
  )

  return (
    <DropdownMenuPortal>
      <DropdownMenuContent align="start" className={styles.content}>
        <DropdownMenuRadioGroup
          value={currentBranch.name}
          onValueChange={handleChangeBranch}
        >
          {branches
            .sort((a, b) => {
              // If a is selected, it comes first
              if (a.name === currentBranch.name) return -1
              // If b is selected, it comes first
              if (b.name === currentBranch.name) return 1
              // Otherwise, maintain original order
              return 0
            })
            .map(({ name }) => (
              <DropdownMenuRadioItem
                key={name}
                value={name}
                label={name}
                className={styles.radioItem}
              />
            ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  )
}
