import { logger, task } from '@trigger.dev/sdk/v3'
import { SCHEMA_OVERRIDE_FILE_PATH } from '../constants'
import { processCreateKnowledgeSuggestion } from '../functions/processCreateKnowledgeSuggestion'
import {
  DOC_FILES,
  processGenerateDocsSuggestion,
} from '../functions/processGenerateDocsSuggestion'
import { processGenerateSchemaOverride } from '../functions/processGenerateSchemaOverride'
import {
  type RepositoryAnalysisPayload,
  processRepositoryAnalysis,
} from '../functions/processRepositoryAnalysis'
import type {
  GenerateSchemaOverridePayload,
  OverallReview,
  Review,
} from '../types'
import { helloWorldTask } from './helloworld'

export const analyzeRepositoryTask = task({
  id: 'analyze-repository',
  run: async (payload: RepositoryAnalysisPayload) => {
    logger.log('Executing repository analysis task:', { payload })

    const result = await processRepositoryAnalysis(payload)

    logger.log('Repository analysis completed:', {
      processedFiles: result.processedFiles,
      errorCount: result.errors.length,
    })

    if (result.errors.length > 0) {
      logger.warn('Repository analysis completed with errors:', {
        errors: result.errors,
      })
    }

    return result
  },
})

export const generateDocsSuggestionTask = task({
  id: 'generate-docs-suggestion',
  run: async (payload: {
    review: Review
    projectId: string
    pullRequestNumber: number
    owner: string
    name: string
    installationId: number
    type: 'DOCS'
    branchName: string
    overallReviewId: string
  }) => {
    const { suggestions, traceId } = await processGenerateDocsSuggestion({
      review: payload.review,
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

export const generateSchemaOverrideSuggestionTask = task({
  id: 'generate-schema-meta-suggestion',
  run: async (payload: GenerateSchemaOverridePayload) => {
    logger.log('Executing schema meta suggestion task:', { payload })
    const result = await processGenerateSchemaOverride(payload)
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
    projectId: string
    type: 'SCHEMA' | 'DOCS'
    title: string
    path: string
    content: string
    branch: string
    traceId?: string
    reasoning: string
    overallReviewId: string
    reviewFeedbackId?: string | null
  }) => {
    logger.log('Executing create knowledge suggestion task:', { payload })
    const result = await processCreateKnowledgeSuggestion(payload)
    logger.info(
      result.suggestionId === null
        ? 'Knowledge suggestion creation skipped due to matching content'
        : 'Successfully created knowledge suggestion:',
      { suggestionId: result.suggestionId },
    )
    return result
  },
})

export const generateKnowledgeFromFeedbackTask = task({
  id: 'generate-knowledge-from-feedback',
  run: async (payload: {
    projectId: string
    title: string
    branch: string
    traceId?: string
    reasoning: string
    overallReview: OverallReview
    review: Review
    reviewFeedbackId: string
  }) => {
    logger.log('Executing generate knowledge from feedback task:', { payload })
    const { suggestions, traceId } = await processGenerateDocsSuggestion({
      review: payload.review,
      projectId: payload.projectId,
      branchOrCommit: payload.branch,
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
        type: 'DOCS',
        title: 'Docs update related to feedback',
        path: `docs/${key}`,
        content: suggestion.content,
        branch: payload.branch,
        traceId,
        reasoning: suggestion.reasoning || '',
        overallReviewId: payload.overallReview.id,
        reviewFeedbackId: payload.reviewFeedbackId,
      })
    }

    const result = await processGenerateSchemaOverride({
      overallReviewId: payload.overallReview.id,
      review: payload.review,
    })
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
        reviewFeedbackId: payload.reviewFeedbackId,
      })
      logger.info('Knowledge suggestion creation triggered')
    } else {
      logger.info(
        'No schema meta update needed, skipping knowledge suggestion creation',
      )
    }

    return {
      success: true,
    }
  },
})

export const helloWorld = async (name?: string) => {
  await helloWorldTask.trigger({ name: name ?? 'World' })
}
