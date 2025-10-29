'use client'

import { useEffect, useState, useTransition } from 'react'
import { formatDate } from '../../../../../../libs/utils'
import { fetchLastCommitData } from '../../../../services/fetchLastCommitData'
import styles from './LastCommitDataWrapper.module.css'

type LastCommitDataWrapperProps = {
  installationId: number
  owner: string
  repo: string
  defaultDate: string
}

type CommitInfo = {
  author: string
  date: string
}

export function LastCommitDataWrapper({
  installationId,
  owner,
  repo,
  defaultDate,
}: LastCommitDataWrapperProps) {
  const [commitInfo, setCommitInfo] = useState<CommitInfo | null>(null)
  const [isLoading, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const data = await fetchLastCommitData(installationId, owner, repo)
      setCommitInfo(data)
    })
  }, [installationId, owner, repo])

  if (isLoading) {
    return <span className={styles.commitInfoText}>Loading commit info...</span>
  }

  // When commit information is available
  if (commitInfo) {
    return (
      <span className={styles.commitInfoText}>
        {`${commitInfo.author} committed on ${formatDate(commitInfo.date)}`}
      </span>
    )
  }

  // Default display (when fetch fails)
  return (
    <span className={styles.commitInfoText}>
      {`User committed on ${formatDate(defaultDate)}`}
    </span>
  )
}
