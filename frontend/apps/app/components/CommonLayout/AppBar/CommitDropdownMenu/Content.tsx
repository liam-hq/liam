'use client'

import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components'
import { urlgen } from '@/utils/routes'
import { useRouter } from 'next/navigation'
import { type FC, useCallback } from 'react'
import styles from './CommitDropdownMenu.module.css'
import type { Commit } from './services/getCommits'

type ContentProps = {
  currentCommit: Commit
  commits: Commit[]
  currentProjectId: string
  currentBranch: string
  isLatest: boolean
  currentPath?: string // Current path (e.g., schema/xxx or docs/xxx)
}

export const Content: FC<ContentProps> = ({
  currentCommit,
  commits,
  currentProjectId,
  currentBranch,
  currentPath,
}) => {
  const router = useRouter()

  const handleChangeCommit = useCallback(
    (commitSha: string) => {
      // If current path exists (e.g., schema/xxx or docs/xxx)
      if (currentPath) {
        // Determine path type (schema or docs)
        let pathType = 'unknown'
        if (currentPath.startsWith('schema')) {
          pathType = 'schema'
        } else if (currentPath.startsWith('docs')) {
          pathType = 'docs'
        }

        // For specific commit
        if (pathType === 'schema') {
          // For schema path
          const schemaPath = currentPath.replace('schema/', '')
          router.push(
            urlgen(
              'projects/[projectId]/ref/[branchOrCommit]/commit/[commit]/schema/[...schemaFilePath]',
              {
                projectId: currentProjectId,
                branchOrCommit: currentBranch,
                commit: commitSha,
                schemaFilePath: schemaPath,
              },
            ),
          )
        } else if (pathType === 'docs') {
          // For docs path
          const docPath = currentPath.replace('docs/', '')
          router.push(
            urlgen(
              'projects/[projectId]/ref/[branchOrCommit]/commit/[commit]/docs/[docFilePath]',
              {
                projectId: currentProjectId,
                branchOrCommit: currentBranch,
                commit: commitSha,
                docFilePath: docPath,
              },
            ),
          )
        } else {
          // For other cases, navigate to specific commit page
          router.push(
            urlgen(
              'projects/[projectId]/ref/[branchOrCommit]/commit/[commit]',
              {
                projectId: currentProjectId,
                branchOrCommit: currentBranch,
                commit: commitSha,
              },
            ),
          )
        }
      } else {
        // If current path doesn't exist (e.g., root page)
        // Navigate to specific commit's schema page
        router.push(
          urlgen(
            'projects/[projectId]/ref/[branchOrCommit]/commit/[commit]/schema/[...schemaFilePath]',
            {
              projectId: currentProjectId,
              branchOrCommit: currentBranch,
              commit: commitSha,
              schemaFilePath: 'schema1.in.rb',
            },
          ),
        )
      }
    },
    [currentProjectId, currentBranch, currentPath, router],
  )

  return (
    <DropdownMenuPortal>
      <DropdownMenuContent align="start" className={styles.content}>
        <DropdownMenuRadioGroup
          value={currentCommit.sha}
          onValueChange={handleChangeCommit}
        >
          {/* Commit history */}
          {commits.map((commit) => (
            <DropdownMenuRadioItem
              key={commit.sha}
              value={commit.sha}
              label={`${commit.shortSha} - ${commit.message.split('\n')[0].substring(0, 30)}${commit.message.length > 30 ? '...' : ''}`}
              className={styles.radioItem}
            />
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  )
}
