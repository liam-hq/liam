import { createClient } from '@/libs/db/server'
import { parse } from '@liam-hq/db-structure/parser'
import { getFileContent } from '@liam-hq/github'

import type { FC } from 'react'
import { ContentForSchemaSection } from './ContentForSchemaSection'
import type { SuggestionWithProject } from './KnowledgeSuggestionDetailPage'
import { processOverrideContent } from './actions/processOverrideContent'
import { getOriginalDocumentContent } from './services/getOriginalDocumentContent'

async function getGithubSchemaFilePath(projectId: string) {
  const projectId_num = projectId
  const supabase = await createClient()
  const { data: gitHubSchemaFilePath, error } = await supabase
    .from('schema_file_paths')
    .select('*')
    .eq('project_id', projectId_num)
    .single()

  if (error || !gitHubSchemaFilePath) {
    throw new Error('Schema file path not found')
  }

  return gitHubSchemaFilePath
}

type Props = {
  suggestion: SuggestionWithProject
  projectId: string
  branchOrCommit: string
}

export const ContentForSchema: FC<Props> = async ({
  suggestion,
  projectId,
  branchOrCommit,
}) => {
  const repository =
    suggestion.projects.project_repository_mappings[0]?.github_repositories
  const repositoryFullName = `${repository.owner}/${repository.name}`

  const githubSchemaFilePath = await getGithubSchemaFilePath(projectId)
  const filePath = githubSchemaFilePath.path
  const format = githubSchemaFilePath.format

  const { content } = await getFileContent(
    repositoryFullName,
    filePath,
    branchOrCommit,
    Number(repository.github_installation_identifier),
  )

  const { value: schema, errors } =
    content !== null && format !== undefined
      ? await parse(content, format)
      : { value: undefined, errors: [] }

  const { result } = schema
    ? await processOverrideContent(suggestion.content, schema)
    : { result: { schema: undefined, tableGroups: {} } }

  return (
    <ContentForSchemaSection
      suggestionContent={suggestion.content}
      suggestionId={suggestion.id}
      originalContent={
        !suggestion.approved_at
          ? await getOriginalDocumentContent(
              projectId,
              suggestion.branch_name,
              suggestion.path,
            )
          : null
      }
      isApproved={!!suggestion.approved_at}
      schema={schema}
      content={content}
      errors={errors || []}
      tableGroups={result?.tableGroups || {}}
    />
  )
}
