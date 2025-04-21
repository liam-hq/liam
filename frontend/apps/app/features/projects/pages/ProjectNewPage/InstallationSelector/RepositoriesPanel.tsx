'use client'

import { addProject } from '@/features/projects/actions'
import type { Repository } from '@liam-hq/github'
import { useEffect, useState } from 'react'
import { RepositoryItem } from '../RepositoryItem'
import styles from './InstallationSelector.module.css'

type Props = {
  installationId: number
  organizationId: string
}

export function RepositoriesPanel({ installationId, organizationId }: Props) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRepositories = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/github/repositories?installationId=${installationId}`,
          { cache: 'no-store' },
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch repositories')
        }

        const data = await response.json()
        setRepositories(data)
      } catch (error) {
        console.error('Error fetching repositories:', error)
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load repositories',
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchRepositories()
  }, [installationId])

  // Show loading state
  if (isLoading) {
    return <div>Loading repositories...</div>
  }

  // Show error state
  if (error) {
    return <div>Error: {error}</div>
  }

  // Show empty state
  if (repositories.length === 0) {
    return <div>No repositories found</div>
  }

  // Render repositories with form actions
  return (
    <div className={styles.repositoriesList}>
      <h3>Repositories</h3>
      {repositories.map((repo) => (
        <form key={repo.id} action={addProject}>
          <input type="hidden" name="projectName" value={repo.name} />
          <input type="hidden" name="repositoryName" value={repo.name} />
          <input
            type="hidden"
            name="repositoryOwner"
            value={repo.owner.login}
          />
          <input type="hidden" name="repositoryId" value={repo.id.toString()} />
          <input
            type="hidden"
            name="installationId"
            value={installationId.toString()}
          />
          <input type="hidden" name="organizationId" value={organizationId} />
          <RepositoryItem name={repo.name} isLoading={false} />
        </form>
      ))}
    </div>
  )
}
