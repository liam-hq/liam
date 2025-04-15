import { logger, task } from '@trigger.dev/sdk/v3'
import { SCHEMA_OVERRIDE_FILE_PATH } from '../constants'
import { getInstallationIdFromRepositoryId } from '../functions/getInstallationIdFromRepositoryId'
import { postComment } from '../functions/postComment'
import { processCreateKnowledgeSuggestion } from '../functions/processCreateKnowledgeSuggestion'
import {
  DOC_FILES,
  processGenerateDocsSuggestion,
} from '../functions/processGenerateDocsSuggestion'
import { processGenerateReview } from '../functions/processGenerateReview'
import { processGenerateSchemaMeta } from '../functions/processGenerateSchemaMeta'
import { processSaveReview } from '../functions/processSaveReview'
import type {
  GenerateReviewPayload,
  GenerateSchemaMetaPayload,
  PostCommentPayload,
  ReviewResponse,
} from '../types'
import { helloWorldTask } from './helloworld'

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

export const saveReviewTask = task({
  id: 'save-review',
  run: async (payload: ReviewResponse & GenerateReviewPayload) => {
    logger.log('Executing review save task:', { payload })
    try {
      const { overallReviewId } = await processSaveReview(payload)

      logger.log('Creating knowledge suggestions for docs')

      const installationId = await getInstallationIdFromRepositoryId(
        payload.repositoryId,
      )

      await postCommentTask.trigger({
        reviewComment: payload.review.bodyMarkdown.content,
        projectId: payload.projectId,
        pullRequestId: payload.pullRequestId,
        repositoryId: payload.repositoryId,
        branchName: payload.branchName,
        traceId: payload.traceId,
      })

      // Trigger docs suggestion generation after review is saved
      await generateDocsSuggestionTask.trigger({
        reviewComment: payload.review.bodyMarkdown.content,
        projectId: payload.projectId,
        pullRequestNumber: payload.pullRequestNumber,
        owner: payload.owner,
        name: payload.name,
        installationId,
        type: 'DOCS',
        branchName: payload.branchName,
        overallReviewId,
      })

      // Trigger schema meta suggestion generation after review is saved
      await generateSchemaMetaSuggestionTask.trigger({
        overallReviewId,
      })

      return { success: true }
    } catch (error) {
      console.error('Error in review process:', error)

      if (error instanceof Error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: error.constructor.name,
          },
        }
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred',
          type: 'UnknownError',
        },
      }
    }
  },
})

export const postCommentTask = task({
  id: 'post-comment',
  run: async (payload: PostCommentPayload) => {
    logger.log('Executing comment post task:', { payload })
    const result = await postComment(payload)
    return result
  },
})

export const generateDocsSuggestionTask = task({
  id: 'generate-docs-suggestion',
  run: async (payload: {
    reviewComment: string
    projectId: number
    pullRequestNumber: number
    owner: string
    name: string
    installationId: number
    type: 'DOCS'
    branchName: string
    overallReviewId: number
  }) => {
    const { suggestions, traceId } = await processGenerateDocsSuggestion({
      reviewComment: payload.reviewComment,
      projectId: payload.projectId,
      branchOrCommit: payload.branchName,
    })

    logger.log('Generated docs suggestions:', { suggestions, traceId })

    for (const key of DOC_FILES) {
      const suggestion = suggestions[key]
      if (!suggestion || !suggestion.content) {
        logger.warn(`No content found for suggestion key: ${key}`)
        continue
      }

      await createKnowledgeSuggestionTask.trigger({
        projectId: payload.projectId,
        type: payload.type,
        title: `Docs update from PR #${payload.pullRequestNumber}`,
        path: `docs/${key}`,
        content: suggestion.content,
        branch: payload.branchName,
        traceId,
        reasoning: suggestion.reasoning || '',
        overallReviewId: payload.overallReviewId,
      })
    }

    return { suggestions, traceId }
  },
})

export const generateSchemaMetaSuggestionTask = task({
  id: 'generate-schema-meta-suggestion',
  run: async (payload: GenerateSchemaMetaPayload) => {
    logger.log('Executing schema meta suggestion task:', { payload })
    const result = await processGenerateSchemaMeta(payload)
    logger.info('Generated schema meta suggestion:', { result })

    if (result.createNeeded) {
      // Create a knowledge suggestion with the schema meta using the returned information
      await createKnowledgeSuggestionTask.trigger({
        projectId: result.projectId,
        type: 'SCHEMA',
        title: result.title,
        path: SCHEMA_OVERRIDE_FILE_PATH,
        content: JSON.stringify(result.override, null, 2),
        branch: result.branchName,
        traceId: result.traceId,
        reasoning: result.reasoning || '',
        overallReviewId: result.overallReviewId,
      })
      logger.info('Knowledge suggestion creation triggered')
    } else {
      logger.info(
        'No schema meta update needed, skipping knowledge suggestion creation',
      )
    }

    return { result }
  },
})

export const createKnowledgeSuggestionTask = task({
  id: 'create-knowledge-suggestion',
  run: async (payload: {
    projectId: number
    type: 'SCHEMA' | 'DOCS'
    title: string
    path: string
    content: string
    branch: string
    traceId?: string
    reasoning: string
    overallReviewId: number
  }) => {
    logger.log('Executing create knowledge suggestion task:', { payload })
    try {
      const result = await processCreateKnowledgeSuggestion(payload)
      logger.info(
        result.suggestionId === null
          ? 'Knowledge suggestion creation skipped due to matching content'
          : 'Successfully created knowledge suggestion:',
        { suggestionId: result.suggestionId },
      )
      return result
    } catch (error) {
      logger.error('Error in createKnowledgeSuggestion task:', { error })
      throw error
    }
  },
})

export const helloWorld = async (name?: string) => {
  await helloWorldTask.trigger({ name: name ?? 'World' })
}
