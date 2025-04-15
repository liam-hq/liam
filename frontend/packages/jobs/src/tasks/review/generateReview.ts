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
import { fetchSchemaInfoWithOverrides } from '../../utils/schemaUtils'
import { saveReviewTask } from './saveReview'

export type GenerateReviewPayload = {
  pullRequestId: number
  projectId: number
  repositoryId: number
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

export type Review = {
  bodyMarkdown: string
  feedbacks: Array<{
    kind: string
    severity:
      | 'POSITIVE'
      | 'CRITICAL'
      | 'WARNING'
      | 'QUESTION'
      | 'HIGH'
      | 'MEDIUM'
      | 'LOW'
    description: string
    suggestion: string
    suggestionSnippets: Array<{
      filename: string
      snippet: string
    }>
  }>
}

export type ReviewResponse = {
  review: Review
  projectId: number
  pullRequestId: number
  repositoryId: number
  branchName: string
  traceId: string
  pullRequestNumber: number
  owner: string
  name: string
}

export const processGenerateReview = async (
  payload: GenerateReviewPayload,
): Promise<{ review: Review; traceId: string }> => {
  try {
    const supabase = createClient()

    const { data: repository, error: repositoryError } = await supabase
      .from('Repository')
      .select('installationId')
      .eq('id', payload.repositoryId)
      .single()

    if (repositoryError || !repository) {
      throw new Error(
        `Repository with ID ${payload.repositoryId} not found: ${JSON.stringify(repositoryError)}`,
      )
    }

    const { data: docPaths, error: docPathsError } = await supabase
      .from('GitHubDocFilePath')
      .select('*')
      .eq('projectId', payload.projectId)
      .eq('isReviewEnabled', true)

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
            Number(repository.installationId),
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
      Number(repository.installationId),
      payload.owner,
      payload.name,
      payload.pullRequestNumber,
    )

    const prComments = await getIssueComments(
      Number(repository.installationId),
      payload.owner,
      payload.name,
      payload.pullRequestNumber,
    )

    const prDescription = prDetails.body || 'No description provided.'

    const formattedComments = prComments
      .map(
        (comment) => `${comment.user?.login || 'Anonymous'}: ${comment.body}`,
      )
      .join('\n\n')

    // Fetch schema information with overrides
    const { overriddenSchema } = await fetchSchemaInfoWithOverrides(
      payload.projectId,
      payload.branchName,
      `${payload.owner}/${payload.name}`,
      Number(repository.installationId),
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
  } catch (error) {
    console.error('Error generating review:', error)
    throw error
  }
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
