import { createClient } from '@/libs/db/server'
import { urlgen } from '@/libs/routes/urlgen'
import { TabsList, TabsTrigger } from '@liam-hq/ui'
import Link from 'next/link'

import type { FC } from 'react'
import styles from './ProjectHeader.module.css'
import { PROJECT_TABS } from './projectConstants'

interface ProjectHeaderProps {
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

export const ProjectHeader: FC<ProjectHeaderProps> = async ({
  projectId,
  branchOrCommit = 'main', // TODO: get default branch from API(using currentOrganization)
}) => {
  const project = await getProject(projectId)

  return (
    <div className={styles.wrapper}>
      <TabsList className={styles.tabsList}>
        {PROJECT_TABS.map((tab) => {
          const Icon = tab.icon
          let href: string

          // For all tabs, use the ref/[branchOrCommit] routes
          switch (tab.value) {
            case 'project':
              href = urlgen('projects/[projectId]/ref/[branchOrCommit]', {
                projectId,
                branchOrCommit,
              })
              break
            case 'schema':
              href = urlgen(
                'projects/[projectId]/ref/[branchOrCommit]/schema/[...schemaFilePath]',
                {
                  projectId,
                  branchOrCommit,
                  schemaFilePath: project.schemaPath?.path || '',
                },
              )
              break
            case 'sessions':
              href = urlgen(
                'projects/[projectId]/ref/[branchOrCommit]/sessions',
                {
                  projectId,
                  branchOrCommit,
                },
              )
              break
          }

          return (
            <Link href={href} key={tab.value}>
              <TabsTrigger value={tab.value} className={styles.tabsTrigger}>
                <Icon size={16} />
                {tab.label}
              </TabsTrigger>
            </Link>
          )
        })}
      </TabsList>
    </div>
  )
}
