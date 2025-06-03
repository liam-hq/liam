import { getFileContent } from '@liam-hq/github'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '../libs/supabase'
import type { FileContent } from '../prompts/generateDocsSuggestion/docsSuggestionSchema'
import { generateDocsSuggestion } from '../prompts/generateDocsSuggestion/generateDocsSuggestion'
import type { Review } from '../types'
import { fetchSchemaInfoWithOverrides } from '../utils/schemaUtils'
import { langfuseLangchainHandler } from './langfuseLangchainHandler'

export const DOC_FILES = [
  'schemaPatterns.md',
  'schemaContext.md',
  'migrationPatterns.md',
  'migrationOpsContext.md',
] as const

type DocFile = (typeof DOC_FILES)[number]

export async function processGenerateDocsSuggestion(payload: {
  review: Review
  projectId: string
  branchOrCommit?: string
}): Promise<{
  suggestions: Record<DocFile, FileContent>
  traceId: string
}> {
  const supabase = createClient()

  // Get repository information from supabase
  const { data: projectRepo, error } = await supabase
    .from('project_repository_mappings')
    .select(`
      *,
      github_repositories(*)
    `)
    .eq('project_id', payload.projectId)
    .limit(1)
    .maybeSingle()

  if (error || !projectRepo?.github_repositories) {
    throw new Error('Repository information not found')
  }

  const repository = projectRepo.github_repositories
  const repositoryFullName = `${repository.owner}/${repository.name}`
  const branch = payload.branchOrCommit || 'main'

  // Fetch all doc files from GitHub
  const docsPromises = DOC_FILES.map(async (filename) => {
    const filePath = `docs/${filename}`
    try {
      const fileData = await getFileContent(
        repositoryFullName,
        filePath,
        branch,
        Number(repository.github_installation_identifier),
      )

      return {
        id: filename,
        title: filename,
        content: fileData.content
          ? JSON.stringify(
              Buffer.from(fileData.content, 'base64').toString('utf-8'),
            ).slice(1, -1)
          : '',
      }
    } catch (error) {
      console.warn(`Could not fetch file ${filePath}: ${error}`)
      return {
        id: filename,
        title: filename,
        content: '',
      }
    }
  })

  const docsArray = await Promise.all(docsPromises)

  // Format docs array as structured markdown instead of raw JSON
  let formattedDocsContent = 'No existing docs found'

  if (docsArray.length > 0) {
    formattedDocsContent = docsArray
      .map((doc) => {
        return `<text>\n\n## ${doc.title}\n\n${doc.content || '*(No content)*'}\n\n</text>\n\n---\n`
      })
      .join('\n')
  }

  const predefinedRunId = uuidv4()
  const callbacks = [langfuseLangchainHandler]

  // Fetch schema information with overrides
  const { overriddenSchema } = await fetchSchemaInfoWithOverrides(
    payload.projectId,
    branch,
    repositoryFullName,
    repository.github_installation_identifier,
  )

  const result = await generateDocsSuggestion(
    payload.review,
    formattedDocsContent,
    callbacks,
    predefinedRunId,
    overriddenSchema,
  )

  const suggestions = Object.fromEntries(
    Object.entries(result)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        // Handle file extensions consistently
        const newKey = key.endsWith('.md') ? key : `${key}.md`
        return [newKey, value]
      }),
  ) as Record<DocFile, FileContent>

  // Return a properly structured object
  return {
    suggestions,
    traceId: predefinedRunId,
  }
}
