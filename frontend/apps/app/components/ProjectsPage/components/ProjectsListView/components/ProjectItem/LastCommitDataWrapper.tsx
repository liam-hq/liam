'use client'

import { useEffect, useState } from 'react'
import { fetchLastCommitData } from '../../../../services/fetchLastCommitData'

interface LastCommitDataWrapperProps {
  installationId: number
  owner: string
  repo: string
  defaultDate: string
}

interface CommitInfo {
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
  const [isLoading, setIsLoading] = useState(true)

  // Date formatting function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  useEffect(() => {
    async function loadData() {
      const data = await fetchLastCommitData(installationId, owner, repo)
      setCommitInfo(data)
      setIsLoading(false)
    }

    loadData()
  }, [installationId, owner, repo])

  if (isLoading) {
    return <span>Loading commit info...</span>
  }

  // When commit information is available
  if (commitInfo) {
    return (
      <>
        <span>{commitInfo.author}</span>
        <span>committed</span>
        <span>on {formatDate(commitInfo.date)}</span>
      </>
    )
  }

  // Default display (when fetch fails)
  return (
    <>
      <span>User</span>
      <span>committed</span>
      <span>on {formatDate(defaultDate)}</span>
    </>
  )
}
