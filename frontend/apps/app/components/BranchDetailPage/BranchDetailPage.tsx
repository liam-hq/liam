import Link from 'next/link'
import { createClient } from '@/libs/db/server'
import { urlgen } from '@/libs/routes'
import styles from './BranchDetailPage.module.css'

type Props = {
  projectId: string
  branchOrCommit: string
}

async function getBranchDetails(projectId: string) {
  const supabase = await createClient()
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_repository_mappings!inner (
        github_repositories (
          id,
          name,
          owner
        )
      )
    `)
    .eq('id', projectId)
    .single()

  if (error || !project) {
    console.error('Error fetching project:', error)
    throw new Error('Project not found')
  }

  const { data: schemaPath, error: schemaPathError } = await supabase
    .from('schema_file_paths')
    .select('path')
    .eq('project_id', projectId)
    .single()

  if (schemaPathError) {
    console.warn(
      `No schema path found for project ${projectId}: ${JSON.stringify(schemaPathError)}`,
    )
  }

  const transformedSchemaPath = schemaPath ? { path: schemaPath.path } : null

  return {
    ...project,
    repository: project.project_repository_mappings[0].github_repositories,
    schemaPath: transformedSchemaPath,
  }
}

export const BranchDetailPage = async ({
  projectId,
  branchOrCommit,
}: Props) => {
  const project = await getBranchDetails(projectId)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href={`/app/projects/${projectId}`} className={styles.backLink}>
            ← Back to Project
          </Link>
          <h1 className={styles.title}>
            {project.name} / {branchOrCommit}
          </h1>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.infoCard}>
          <h2 className={styles.sectionTitle}>Project Resources</h2>
          <div className={styles.resourceGrid}>
            <div className={styles.resourceSection}>
              <h3 className={styles.resourceTitle}>ERD Diagrams</h3>
              {project.schemaPath && (
                <Link
                  href={urlgen(
                    'projects/[projectId]/ref/[branchOrCommit]/schema/[...schemaFilePath]',
                    {
                      projectId: String(projectId),
                      branchOrCommit,
                      schemaFilePath: project.schemaPath.path,
                    },
                  )}
                  className={styles.resourceLink}
                >
                  View ERD for {project.schemaPath.path}
                  <span className={styles.linkArrow}>→</span>
                </Link>
              )}
              {!project.schemaPath && (
                <div className={styles.noPatterns}>
                  No schema file path configured for this project
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
