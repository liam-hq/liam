import type { Tables } from '@liam-hq/db/supabase/database.types'
import { GithubLogo } from '@liam-hq/ui'
import Link from 'next/link'
import type { FC } from 'react'
import { urlgen } from '../../../../../../libs/routes'
import { formatDate } from '../../../../../../libs/utils'
import { ProjectIcon } from '../../../../../ProjectIcon'
import { LastCommitDataWrapper } from './LastCommitDataWrapper'
import { OrganizationDataWrapper } from './OrganizationDataWrapper'
import styles from './ProjectItem.module.css'

type ProjectWithRepositories = Tables<'projects'> & {
  project_repository_mappings?: Array<{
    repository: Tables<'github_repositories'>
  }>
}

type ProjectItemProps = {
  project: ProjectWithRepositories
}

export const ProjectItem: FC<ProjectItemProps> = ({ project }) => {
  const repositoryName = project.name?.toLowerCase() || 'untitled-project'
  const repository = project.project_repository_mappings?.[0]?.repository

  return (
    <Link
      href={urlgen('projects/[projectId]', {
        projectId: `${project.id}`,
      })}
      className={styles.projectItem}
    >
      <div className={styles.projectHeader}>
        <div className={styles.projectIcon}>
          <div className={styles.projectIconPlaceholder}>
            {repository ? (
              <OrganizationDataWrapper
                installationId={repository.github_installation_identifier}
                owner={repository.owner}
                repo={repository.name}
              />
            ) : (
              <ProjectIcon className={styles.projectIcon} />
            )}
          </div>
        </div>
        <h2 className={styles.projectName}>{project.name}</h2>
      </div>

      <div className={styles.projectInfo}>
        <div className={styles.repositoryBadge}>
          <GithubLogo className={styles.repositoryIcon} />
          <span className={styles.repositoryName}>
            {repository
              ? `${repository.owner}/${repository.name}`
              : repositoryName}
          </span>
        </div>

        <div className={styles.commitInfo}>
          {repository ? (
            <LastCommitDataWrapper
              installationId={repository.github_installation_identifier}
              owner={repository.owner}
              repo={repository.name}
              defaultDate={project.created_at}
            />
          ) : (
            <>
              <span>User</span>
              <span>committed</span>
              <span>on {formatDate(project.created_at)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
