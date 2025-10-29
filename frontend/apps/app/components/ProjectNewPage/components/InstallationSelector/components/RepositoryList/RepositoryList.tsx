import type { Repository } from '@liam-hq/github'
import type { FC } from 'react'
import { RepositoryItem } from './RepositoryItem'
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
  if (repositories.length === 0 || !hasSelectedInstallation || error) {
    // TODO: Early-return placeholder for now; surface a proper empty/error state in a follow-up PR.
    return null
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
