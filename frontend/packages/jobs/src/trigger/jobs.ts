import { logger, task } from '@trigger.dev/sdk/v3'
import { createClient } from '../libs/supabase'

// FIXME: This should be imported from the app package once we have proper package structure
const OVERRIDE_SCHEMA_FILE_PATH = '.liam/schema-meta.json'
import { getInstallationIdFromRepositoryId } from '../functions/getInstallationIdFromRepositoryId'
import { postComment } from '../functions/postComment'
import { processCreateKnowledgeSuggestion } from '../functions/processCreateKnowledgeSuggestion'
import {
  DOC_FILES,
  processGenerateDocsSuggestion,
} from '../functions/processGenerateDocsSuggestion'
import { processGenerateReview } from '../functions/processGenerateReview'
import { processGenerateSchemaMeta } from '../functions/processGenerateSchemaMeta'
import { processSavePullRequest } from '../functions/processSavePullRequest'
import { processSaveReview } from '../functions/processSaveReview'
import type {
  GenerateReviewPayload,
  GenerateSchemaMetaPayload,
  PostCommentPayload,
  ReviewResponse,
  SavePullRequestPayload,
} from '../types'
import { helloWorldTask } from './helloworld'

export const savePullRequestTask = task({
  id: 'save-pull-request',
  run: async (payload: SavePullRequestPayload) => {
    logger.log('Executing PR save task:', { payload })

    try {
      const result = await processSavePullRequest(payload)
      logger.info('Successfully saved PR to database:', { prId: result.prId })

      // Get repository information from the result
      const supabase = createClient()
      const { data: repository, error: repositoryError } = await supabase
        .from('Repository')
        .select('*')
        .eq('id', result.repositoryId)
        .single()

      if (repositoryError || !repository) {
        throw new Error(
          `Repository not found: ${JSON.stringify(repositoryError)}`,
        )
      }

      // Trigger the next task in the chain - generate review
      await generateReviewTask.trigger({
        pullRequestId: result.prId,
        projectId: payload.projectId,
        repositoryId: repository.id,
        branchName: result.branchName,
        owner: repository.owner,
        name: repository.name,
        pullRequestNumber: payload.prNumber,
        schemaFiles: result.schemaFiles,
        fileChanges: result.fileChanges,
      })

      return result
    } catch (error) {
      logger.error('Error in savePullRequest task:', { error })
      throw error
    }
  },
})

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
      await processSaveReview(payload)

      logger.log('Creating knowledge suggestions for docs:', {
        count: payload.schemaFiles.length,
      })

      const installationId = await getInstallationIdFromRepositoryId(
        payload.repositoryId,
      )

      await postCommentTask.trigger({
        reviewComment: payload.review.bodyMarkdown,
        projectId: payload.projectId,
        pullRequestId: payload.pullRequestId,
        repositoryId: payload.repositoryId,
        branchName: payload.branchName,
        traceId: payload.traceId,
      })

      // Trigger docs suggestion generation after review is saved
      await generateDocsSuggestionTask.trigger({
        reviewComment: payload.review.bodyMarkdown,
        projectId: payload.projectId,
        pullRequestNumber: payload.pullRequestNumber,
        owner: payload.owner,
        name: payload.name,
        installationId,
        type: 'DOCS',
        branchName: payload.branchName,
      })

      // Get the overall review ID from the database
      const supabase = createClient()
      const { data: overallReview, error: overallReviewError } = await supabase
        .from('OverallReview')
        .select('id')
        .eq('pullRequestId', payload.pullRequestId)
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (overallReviewError) {
        logger.error('Error fetching overall review', {
          error: overallReviewError,
          pullRequestId: payload.pullRequestId,
        })
      }

      if (!overallReview) {
        logger.error('No overall review found for pull request', {
          pullRequestId: payload.pullRequestId,
        })
      } else {
        // Trigger schema meta suggestion generation after review is saved
        await generateSchemaMetaSuggestionTask.trigger({
          overallReviewId: overallReview.id,
        })
      }

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
        path: OVERRIDE_SCHEMA_FILE_PATH,
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
    overallReviewId?: number
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
