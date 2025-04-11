import { v4 as uuidv4 } from 'uuid'

import {
  getFileContent,
  getIssueComments,
  getPullRequestDetails,
} from '@liam-hq/github'
import { createClient } from '../libs/supabase'

import { generateReview } from '../prompts/generateReview/generateReview'
import type { GenerateReviewPayload, Review } from '../types'
import { langfuseLangchainHandler } from './langfuseLangchainHandler'

export const processGenerateReview = async (
  payload: GenerateReviewPayload,
): Promise<{ review: Review; traceId: string }> => {
  try {
    const supabase = createClient()

    // Get repository installationId
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

    // Get review-enabled doc paths
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

    // Fetch content for each doc path
    const docsContent = await Promise.all(
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

          return {
            url: docPath.path,
            content: fileData.content,
          }
        } catch (error) {
          console.error(`Error fetching content for ${docPath.path}:`, error)
          return null
        }
      }),
    ).then(
      (results) =>
        results.filter(Boolean) as { url: string; content: string }[],
    )

    const predefinedRunId = uuidv4()

    // Fetch PR details to get the description
    const prDetails = await getPullRequestDetails(
      Number(repository.installationId),
      payload.owner,
      payload.name,
      payload.pullRequestNumber,
    )

    // Fetch PR comments
    const prComments = await getIssueComments(
      Number(repository.installationId),
      payload.owner,
      payload.name,
      payload.pullRequestNumber,
    )

    // Format PR description
    const prDescription = prDetails.body || 'No description provided.'

    // Format comments for the prompt
    const formattedComments = prComments
      .map(
        (comment) => `${comment.user?.login || 'Anonymous'}: ${comment.body}`,
      )
      .join('\n\n')

    const callbacks = [langfuseLangchainHandler]
    const review = await generateReview(
      docsContent,
      payload.schemaFile,
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
