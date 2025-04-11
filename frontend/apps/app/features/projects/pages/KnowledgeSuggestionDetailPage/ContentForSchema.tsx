import { createClient } from '@/libs/db/server'
import {
  type SupportedFormat,
  detectFormat,
  parse,
} from '@liam-hq/db-structure/parser'
import { getFileContent } from '@liam-hq/github'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import { processOverrideContent } from '../../actions/processOverrideContent'
import { getOriginalDocumentContent } from '../../utils/getOriginalDocumentContent'
import { ContentForSchemaSection } from './ContentForSchemaSection'
import type { SuggestionWithProject } from './KnowledgeSuggestionDetailPage'

async function getGithubSchemaFilePath(projectId: string) {
  try {
    const projectId_num = Number(projectId)
    const supabase = await createClient()
    const { data: gitHubSchemaFilePath, error } = await supabase
      .from('GitHubSchemaFilePath')
      .select('*')
      .eq('projectId', projectId_num)
      .order('createdAt', { ascending: false })
      .limit(1) // TODO: Remove this once we have a way to choose primary file path?
      .single()

    if (error || !gitHubSchemaFilePath) {
      console.error('Error fetching github schema file path:', error)
      notFound()
    }

    return gitHubSchemaFilePath
  } catch (error) {
    console.error('Error fetching github schema file path:', error)
    notFound()
  }
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
  const repository = suggestion.project.repositoryMappings[0]?.repository
  const repositoryFullName = `${repository.owner}/${repository.name}`

  const githubSchemaFilePath = await getGithubSchemaFilePath(projectId)
  const filePath = githubSchemaFilePath.path

  const { content } = await getFileContent(
    repositoryFullName,
    filePath,
    branchOrCommit,
    Number(repository.installationId),
  )

  const format = detectFormat(filePath)
  const { value: dbStructure, errors } =
    content !== null && format !== undefined
      ? await parse(content, format as SupportedFormat)
      : { value: undefined, errors: [] }

  const { result } = dbStructure
    ? await processOverrideContent(suggestion.content, dbStructure)
    : { result: { dbStructure: undefined, tableGroups: {} } }

  return (
    <ContentForSchemaSection
      suggestionContent={suggestion.content}
      suggestionId={suggestion.id}
      originalContent={
        !suggestion.approvedAt
          ? await getOriginalDocumentContent(
              projectId,
              suggestion.branchName,
              suggestion.path,
            )
          : null
      }
      isApproved={!!suggestion.approvedAt}
      dbStructure={dbStructure}
      format={format as SupportedFormat | undefined}
      content={content}
      errors={errors || []}
      tableGroups={result?.tableGroups || {}}
    />
  )
}
