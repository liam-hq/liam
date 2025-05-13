import { createClient } from '@/libs/db/server'
import { urlgen } from '@/libs/routes/urlgen'
import { Button, Library, RoundBadge, TabsList, TabsTrigger } from '@liam-hq/ui'
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

  const { data: docPaths, error: docPathsError } = await supabase
    .from('doc_file_paths')
    .select('path')
    .eq('project_id', projectId)

  if (docPathsError) {
    console.error('Error fetching doc paths:', docPathsError)
  }

  const transformedSchemaPath = schemaPath ? { path: schemaPath.path } : null
  const transformedDocPaths =
    docPaths?.map((docPath) => ({
      path: docPath.path,
    })) || []

  return {
    ...project,
    repository: project.project_repository_mappings[0].github_repositories,
    schemaPath: transformedSchemaPath,
    docPaths: transformedDocPaths,
  }
}

// Function to get knowledge suggestions count without try-catch
async function getKnowledgeSuggestionsCount(
  projectId: string,
): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('knowledge_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('approved_at', null) // Count suggestions that haven't been approved yet

  if (error) {
    console.error('Error fetching knowledge suggestions count:', error)
    return 0
  }

  return count || 0
}

export const ProjectHeader: FC<ProjectHeaderProps> = async ({
  projectId,
  branchOrCommit = 'main', // TODO: get default branch from API(using currentOrganization)
}) => {
  const project = await getProject(projectId)
  const knowledgeSuggestionsCount =
    await getKnowledgeSuggestionsCount(projectId)

  const knowledgeSuggestionsUrl = urlgen(
    'projects/[projectId]/ref/[branchOrCommit]/knowledge-suggestions',
    {
      projectId,
      branchOrCommit,
    },
  )

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
            case 'migrations':
              href = urlgen(
                'projects/[projectId]/ref/[branchOrCommit]/migrations',
                {
                  projectId,
                  branchOrCommit,
                },
              )
              break
            case 'docs':
              href = urlgen('projects/[projectId]/ref/[branchOrCommit]/docs', {
                projectId,
                branchOrCommit,
              })
              break
            default:
              // For other tabs like 'rule' and 'settings' that might not have ref/[branchOrCommit] routes
              href = urlgen(`projects/[projectId]/${tab.value}`, {
                projectId,
              })
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

      <Link href={knowledgeSuggestionsUrl}>
        <Button
          variant="outline-secondary"
          className={styles.knowledgeSuggestionButton}
        >
          <Library size={16} />
          Knowledge Suggestions
          {knowledgeSuggestionsCount > 0 && (
            <RoundBadge variant="green">{knowledgeSuggestionsCount}</RoundBadge>
          )}
        </Button>
      </Link>
    </div>
  )
}
