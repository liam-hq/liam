import { notFound } from 'next/navigation'
import type { FC } from 'react'
import { createClient } from '../../../libs/db/server'
import styles from './ProjectHeader.module.css'
import { PROJECT_TABS } from './projectConstants'
import { TabItem } from './TabItem'

type ProjectHeaderProps = {
  projectId: string
  branchOrCommit?: string
}

async function getProject(projectId: string) {
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
    notFound()
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
    repository: project.project_repository_mappings[0]?.github_repositories,
    schemaPath: transformedSchemaPath,
  }
}

export const ProjectHeader: FC<ProjectHeaderProps> = async ({
  projectId,
  branchOrCommit = 'main',
}) => {
  const project = await getProject(projectId)

  return (
    <div className={styles.wrapper}>
      <div className={styles.list}>
        {PROJECT_TABS.map((tab) => (
          <TabItem
            key={tab.value}
            item={tab}
            projectId={projectId}
            branchOrCommit={branchOrCommit}
            schemaFilePath={project.schemaPath?.path}
          />
        ))}
      </div>
    </div>
  )
}
