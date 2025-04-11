import { createClient } from '@/libs/db/server'
import { urlgen } from '@/utils/routes'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import styles from './ProjectDetailPage.module.css'

type Props = {
  projectId: string
}

async function getProject(projectId: string) {
  try {
    const supabase = await createClient()
    const { data: project, error } = await supabase
      .from('Project')
      .select(`
        id,
        name,
        createdAt,
        ProjectRepositoryMapping:ProjectRepositoryMapping(
          repository:Repository(
            pullRequests:PullRequest(
              id,
              pullNumber,
              migration:Migration(
                id,
                title
              )
            )
          )
        )
      `)
      .eq('id', Number(projectId))
      .single()

    if (error || !project) {
      console.error('Error fetching project:', error)
      notFound()
    }

    // Extract migrations from the nested structure
    const migrations = project.ProjectRepositoryMapping.flatMap((mapping) =>
      mapping.repository.pullRequests
        .filter((pr) => pr.migration !== null)
        .map((pr) => {
          // Handle case where migration might be an array due to Supabase's return format
          const migration = Array.isArray(pr.migration)
            ? pr.migration[0]
            : pr.migration
          return {
            id: migration.id,
            title: migration.title,
            pullNumber: pr.pullNumber,
          }
        }),
    )

    return {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      migrations,
    }
  } catch (error) {
    console.error('Error in getProject:', error)
    notFound()
  }
}

// TODO: Delete this page
export const ProjectDetailPage: FC<Props> = async ({ projectId }) => {
  const project = await getProject(projectId)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link
            href={urlgen('projects')}
            className={styles.backLink}
            aria-label="Back to projects list"
          >
            ← Back to Projects
          </Link>
          <h1 className={styles.title}>{project.name || 'Untitled Project'}</h1>
        </div>
        <div className={styles.headerActions}>
          <Link
            href={urlgen('projects/[projectId]/migrations', {
              projectId,
            })}
            className={styles.actionButton}
          >
            View Migrations
          </Link>
          <Link
            href={urlgen('projects/[projectId]/docs', {
              projectId,
            })}
            className={styles.actionButton}
          >
            View Docs
          </Link>
          <Link
            href={`/app/projects/${project.id}/branches`}
            className={styles.actionButton}
          >
            View Branches
          </Link>
        </div>
      </div>

      <div className={styles.content}>
        <p className={styles.createdAt}>
          Created: {new Date(project.createdAt).toLocaleDateString('en-US')}
        </p>
      </div>
    </div>
  )
}
