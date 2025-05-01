'use client'

import { DropdownMenuRoot, DropdownMenuTrigger } from '@/components'
import { ChevronsUpDown } from '@/icons'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import styles from './CommitDropdownMenu.module.css'
import { Content } from './Content'
import { type Commit, getCommits } from './services/getCommits'

type Props = {
  currentProjectId: string
  currentBranchOrCommit: string
  currentBranch?: string // For displaying a specific branch (in case of route b)
  currentCommit?: string // For displaying a specific commit (in case of route b)
  pathname?: string // Current path
}

export const CommitDropdownMenu: FC<Props> = ({
  currentProjectId,
  currentBranchOrCommit,
  currentBranch,
  currentCommit: currentCommitSha,
  pathname = '',
}) => {
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentCommit, setCurrentCommit] = useState<Commit | null>(null)
  // Extract the remaining path after removing the project ID and branch/commit parts
  let currentPath: string | undefined

  // Extract commit hash from URL
  let commitHashFromUrl: string | undefined

  if (pathname) {
    // Extract commit hash from URL
    // Extract commit hash from the format /commit/xxxxx/
    if (pathname.includes('/commit/')) {
      const commitRegex = /\/commit\/([^\/]+)/
      const commitMatch = pathname.match(commitRegex)
      if (commitMatch?.[1]) {
        commitHashFromUrl = commitMatch[1]
      }
    }

    // Extract schema page path
    if (pathname.includes('/schema/')) {
      const schemaIndex = pathname.indexOf('/schema/')
      if (schemaIndex !== -1) {
        currentPath = pathname.substring(schemaIndex + 1) // Remove leading slash
      }
    }
    // Extract documentation page path
    else if (pathname.includes('/docs/')) {
      const docsIndex = pathname.indexOf('/docs/')
      if (docsIndex !== -1) {
        currentPath = pathname.substring(docsIndex + 1) // Remove leading slash
      }
    }
    // For other cases, use the traditional path extraction method
    else if (currentBranch) {
      // For route b (specific commit)
      const regex = new RegExp(
        `/app/projects/${currentProjectId}/ref/${currentBranch}/commit/${currentBranchOrCommit}(/.*)?$`,
      )
      const match = pathname.match(regex)
      if (match?.[1]) {
        currentPath = match[1].substring(1) // Remove leading slash
      }
    } else {
      // For route a (branch)
      const regex = new RegExp(
        `/app/projects/${currentProjectId}/ref/${currentBranchOrCommit}(/.*)?$`,
      )
      const match = pathname.match(regex)
      if (match?.[1]) {
        currentPath = match[1].substring(1) // Remove leading slash
      }
    }
  }

  // For route a, currentBranchOrCommit is the branch name
  // For route b, currentBranch is specified
  const branch = currentBranch || currentBranchOrCommit

  // Calculate isLatest based on URL path
  // If path includes '/commit/', isLatest is false, otherwise true
  const isLatest = !pathname.includes('/commit/')

  // biome-ignore lint/correctness/useExhaustiveDependencies: poc
  useEffect(() => {
    const fetchCommits = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch commit list
        const fetchedCommits = await getCommits(
          currentProjectId,
          branch,
          currentBranchOrCommit,
        )

        if (!fetchedCommits || fetchedCommits.length === 0) {
          setCommits([])
          setCurrentCommit(null)
          return
        }

        setCommits(fetchedCommits)

        // Identify the current commit
        // biome-ignore lint/suspicious/noImplicitAnyLet: poc
        let commit

        // If commit hash from URL exists, prioritize it
        if (commitHashFromUrl) {
          const commitByUrl = fetchedCommits.find((c) =>
            c.sha.startsWith(commitHashFromUrl),
          )
          if (commitByUrl) {
            commit = commitByUrl
          } else {
            // If commit from URL is not found, use other methods to identify
            if (currentCommitSha) {
              const commitByCurrentCommit = fetchedCommits.find((c) =>
                c.sha.startsWith(currentCommitSha),
              )
              if (commitByCurrentCommit) {
                commit = commitByCurrentCommit
              } else {
                commit = fetchedCommits[0]
              }
            } else if (isLatest) {
              commit = fetchedCommits[0]
            } else {
              const commitBySha = fetchedCommits.find((c) =>
                c.sha.startsWith(currentBranchOrCommit),
              )
              if (commitBySha) {
                commit = commitBySha
              } else {
                commit = fetchedCommits[0]
              }
            }
          }
        }
        // If currentCommitSha is specified, prioritize it
        else if (currentCommitSha) {
          const commitByCurrentCommit = fetchedCommits.find((c) =>
            c.sha.startsWith(currentCommitSha),
          )
          if (commitByCurrentCommit) {
            commit = commitByCurrentCommit
          } else {
            commit = fetchedCommits[0]
          }
        } else if (isLatest) {
          commit = fetchedCommits[0]
        } else {
          const commitBySha = fetchedCommits.find((c) =>
            c.sha.startsWith(currentBranchOrCommit),
          )
          if (commitBySha) {
            commit = commitBySha
          } else {
            commit = fetchedCommits[0]
          }
        }
        setCurrentCommit(commit)
      } catch (err) {
        console.error('Error fetching commits:', err)
        setError('Failed to fetch commits')
      } finally {
        setLoading(false)
      }
    }

    fetchCommits()
  }, [
    currentProjectId,
    branch,
    currentBranchOrCommit,
    currentCommitSha,
    isLatest,
    pathname,
  ])

  // Do not display if commits cannot be retrieved
  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return null
  }

  if (!commits || commits.length === 0 || !currentCommit) {
    return null
  }

  return (
    <DropdownMenuRoot>
      <Trigger currentCommit={currentCommit} isLatest={isLatest} />
      <Content
        currentCommit={currentCommit}
        commits={commits}
        currentProjectId={currentProjectId}
        currentBranch={branch}
        isLatest={isLatest}
        currentPath={currentPath}
      />
    </DropdownMenuRoot>
  )
}

type TriggerProps = {
  currentCommit: Commit
  isLatest: boolean
}

const Trigger: FC<TriggerProps> = ({ currentCommit }) => {
  return (
    <DropdownMenuTrigger className={styles.trigger}>
      <div className={styles.nameAndTag}>
        <span className={styles.name}>{currentCommit.shortSha}</span>
      </div>
      <ChevronsUpDown className={styles.chevronIcon} />
    </DropdownMenuTrigger>
  )
}
