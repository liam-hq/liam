import {
  getFileContent,
  getIssueComments,
  getPullRequestDetails,
} from '@liam-hq/github'
import { logger, task } from '@trigger.dev/sdk/v3'
import { v4 as uuidv4 } from 'uuid'
import { langfuseLangchainHandler } from '../../functions/langfuseLangchainHandler'
import { createClient } from '../../libs/supabase'
import { generateReview } from '../../prompts/generateReview/generateReview'
import type { Review } from '../../types'
import { fetchSchemaInfoWithOverrides } from '../../utils/schemaUtils'
import { saveReviewTask } from './saveReview'

export type GenerateReviewPayload = {
  pullRequestId: string
  projectId: string
  repositoryId: string
  branchName: string
  owner: string
  name: string
  pullRequestNumber: number
  schemaFile: {
    filename: string
    content: string
  }
  fileChanges: Array<{
    filename: string
    status:
      | 'added'
      | 'modified'
      | 'deleted'
      | 'removed'
      | 'renamed'
      | 'copied'
      | 'changed'
      | 'unchanged'
    changes: number
    patch: string
  }>
}

export type ReviewResponse = {
  review: Review
  projectId: string
  pullRequestId: string
  repositoryId: string
  branchName: string
  traceId: string
  pullRequestNumber: number
  owner: string
  name: string
}

export const processGenerateReview = async (
  payload: GenerateReviewPayload,
): Promise<{ review: Review; traceId: string }> => {
  const supabase = createClient()

  const { data: repository, error: repositoryError } = await supabase
    .from('github_repositories')
    .select('github_installation_identifier')
    .eq('id', payload.repositoryId)
    .single()

  if (repositoryError || !repository) {
    throw new Error(
      `Repository with ID ${payload.repositoryId} not found: ${JSON.stringify(repositoryError)}`,
    )
  }

  const { data: docPaths, error: docPathsError } = await supabase
    .from('doc_file_paths')
    .select('*')
    .eq('project_id', payload.projectId)
    .eq('is_review_enabled', true)

  if (docPathsError) {
    throw new Error(
      `Error fetching doc paths: ${JSON.stringify(docPathsError)}`,
    )
  }

  const docsContentArray = await Promise.all(
    docPaths.map(async (docPath: { path: string }) => {
      try {
        const fileData = await getFileContent(
          `${payload.owner}/${payload.name}`,
          docPath.path,
          payload.branchName,
          Number(repository.github_installation_identifier),
        )

        if (!fileData.content) {
          console.warn(`No content found for ${docPath.path}`)
          return null
        }

        return `# ${docPath.path}\n\n${fileData.content}`
      } catch (error) {
        console.error(`Error fetching content for ${docPath.path}:`, error)
        return null
      }
    }),
  )

  const docsContent = docsContentArray.filter(Boolean).join('\n\n---\n\n')

  const predefinedRunId = uuidv4()

  const prDetails = await getPullRequestDetails(
    Number(repository.github_installation_identifier),
    payload.owner,
    payload.name,
    payload.pullRequestNumber,
  )

  const prComments = await getIssueComments(
    Number(repository.github_installation_identifier),
    payload.owner,
    payload.name,
    payload.pullRequestNumber,
  )

  const prDescription = prDetails.body || 'No description provided.'

  const formattedComments = prComments
    .map((comment) => `${comment.user?.login || 'Anonymous'}: ${comment.body}`)
    .join('\n\n')

  // Fetch schema information with overrides
  const { overriddenSchema } = await fetchSchemaInfoWithOverrides(
    payload.projectId,
    payload.branchName,
    `${payload.owner}/${payload.name}`,
    repository.github_installation_identifier,
  )

  const callbacks = [langfuseLangchainHandler]
  const review = await generateReview(
    docsContent,
    overriddenSchema,
    payload.fileChanges,
    prDescription,
    formattedComments,
    callbacks,
    predefinedRunId,
  )

  return { review: review, traceId: predefinedRunId }
}

export const generateReviewTask = task({
  id: 'generate-review',
  run: async (payload: GenerateReviewPayload) => {
    const { review, traceId } = await processGenerateReview(payload)
    logger.log('Generated review:', { review })
    await saveReviewTask.trigger({
      review,
      traceId,
      ...payload,
    })
    return { review }
  },
})
