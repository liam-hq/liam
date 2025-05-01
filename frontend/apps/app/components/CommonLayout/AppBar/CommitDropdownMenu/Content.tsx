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
}

export const Content: FC<ContentProps> = ({
  currentCommit,
  commits,
  currentProjectId,
  currentBranch,
  isLatest,
}) => {
  const router = useRouter()

  const handleChangeCommit = useCallback(
    (commitSha: string) => {
      // 最新コミットの場合はブランチページに遷移
      if (commitSha === 'latest') {
        router.push(
          urlgen('projects/[projectId]/ref/[branchOrCommit]', {
            projectId: currentProjectId,
            branchOrCommit: currentBranch,
          }),
        )
        return
      }
      
      // それ以外の場合は特定コミットページに遷移
      router.push(
        urlgen('projects/[projectId]/ref/[branch]/commit/[commit]', {
          projectId: currentProjectId,
          branch: currentBranch,
          commit: commitSha,
        }),
      )
    },
    [currentProjectId, currentBranch, router],
  )

  return (
    <DropdownMenuPortal>
      <DropdownMenuContent align="start" className={styles.content}>
        <DropdownMenuRadioGroup
          value={isLatest ? 'latest' : currentCommit.sha}
          onValueChange={handleChangeCommit}
        >
          {/* 最新コミットオプション */}
          <DropdownMenuRadioItem
            key="latest"
            value="latest"
            label={`latest (${commits[0].shortSha})`}
            className={styles.radioItem}
          />
          
          {/* コミット履歴 */}
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
