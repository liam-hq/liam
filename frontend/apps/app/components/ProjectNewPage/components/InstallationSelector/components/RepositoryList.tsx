import type { Repository } from '@liam-hq/github'
import type { FC } from 'react'
import { RepositoryItem } from '../../RepositoryItem'
import styles from './RepositoryList.module.css'

type RepositoryListProps = {
  repositories: Repository[]
  error?: string
  isAddingProject: boolean
  hasSelectedInstallation: boolean
  onSelectRepository: (repository: Repository) => void
}

export const RepositoryList: FC<RepositoryListProps> = ({
  repositories,
  error,
  isAddingProject,
  hasSelectedInstallation,
  onSelectRepository,
}) => {
  if (error) {
    return <div className={styles.error}>Error: {error}</div>
  }

  if (repositories.length === 0) {
    return (
      <div className={styles.placeholder}>
        {hasSelectedInstallation
          ? 'No repositories found for this installation.'
          : 'Select a GitHub installation to view repositories.'}
      </div>
    )
  }

  return (
    <div className={styles.repositoriesSection}>
      <h3 className={styles.sectionTitle}>Repositories</h3>
      <div className={styles.repositoriesList}>
        {repositories.map((repo) => (
          <RepositoryItem
            key={repo.id}
            name={repo.name}
            onClick={() => onSelectRepository(repo)}
            isLoading={isAddingProject}
          />
        ))}
      </div>
    </div>
  )
}
