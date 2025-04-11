import { type DBOverride, dbOverrideSchema } from '@liam-hq/db-structure'
import { getFileContent } from '@liam-hq/github'
import { v4 as uuidv4 } from 'uuid'
import { safeParse } from 'valibot'
import { createClient } from '../libs/supabase'
import { generateSchemaMeta } from '../prompts/generateSchemaMeta/generateSchemaMeta'
import type { GenerateSchemaMetaPayload, SchemaMetaResult } from '../types'
import { fetchSchemaFilesContent } from '../utils/githubFileUtils'
import { langfuseLangchainHandler } from './langfuseLangchainHandler'

const OVERRIDE_SCHEMA_FILE_PATH = '.liam/schema-meta.json'

export const processGenerateSchemaMeta = async (
  payload: GenerateSchemaMetaPayload,
): Promise<SchemaMetaResult> => {
  try {
    const supabase = createClient()

    // Get the overall review from the database with nested relations
    const { data: overallReview, error } = await supabase
      .from('OverallReview')
      .select(`
        *,
        pullRequest:PullRequest(*,
          repository:Repository(*)
        ),
        project:Project(*)
      `)
      .eq('id', payload.overallReviewId)
      .single()

    if (error || !overallReview) {
      throw new Error(
        `Overall review with ID ${payload.overallReviewId} not found: ${JSON.stringify(error)}`,
      )
    }

    const { pullRequest, project } = overallReview
    if (!pullRequest) {
      throw new Error(
        `Pull request not found for overall review ${payload.overallReviewId}`,
      )
    }

    if (!project) {
      throw new Error(
        `Project not found for overall review ${payload.overallReviewId}`,
      )
    }

    const { repository } = pullRequest
    if (!repository) {
      throw new Error(`Repository not found for pull request ${pullRequest.id}`)
    }

    const predefinedRunId = uuidv4()

    const callbacks = [langfuseLangchainHandler]

    // Fetch the current schema metadata file from GitHub
    const repositoryFullName = `${repository.owner}/${repository.name}`
    const { content: currentSchemaMetaContent } = await getFileContent(
      repositoryFullName,
      OVERRIDE_SCHEMA_FILE_PATH,
      overallReview.branchName,
      Number(repository.installationId),
    )

    // Parse and validate the current schema metadata if it exists
    let currentSchemaMeta: DBOverride | null = null
    if (currentSchemaMetaContent) {
      const parsedJson = JSON.parse(currentSchemaMetaContent)
      const result = safeParse(dbOverrideSchema, parsedJson)

      if (result.success) {
        currentSchemaMeta = result.output
      }
    }

    // Enrich AI context with actual schema structure for more accurate metadata suggestions
    const schemaFiles = await fetchSchemaFilesContent(
      Number(project.id),
      overallReview.branchName,
      repositoryFullName,
      Number(repository.installationId),
    )

    const schemaMetaResult = await generateSchemaMeta(
      overallReview.reviewComment || '',
      callbacks,
      currentSchemaMeta,
      predefinedRunId,
      schemaFiles, // Add schema files content
    )

    // If no update is needed, return early with createNeeded: false
    if (!schemaMetaResult.updateNeeded) {
      return {
        createNeeded: false,
      }
    }

    // Return the schema meta along with information needed for createKnowledgeSuggestionTask
    return {
      createNeeded: true,
      override: schemaMetaResult.override,
      projectId: project.id,
      pullRequestNumber: Number(pullRequest.pullNumber), // Convert bigint to number
      branchName: overallReview.branchName, // Get branchName from overallReview
      title: `Schema meta update from PR #${Number(pullRequest.pullNumber)}`,
      traceId: predefinedRunId,
      reasoning: schemaMetaResult.reasoning,
      overallReviewId: payload.overallReviewId,
    }
  } catch (error) {
    console.error('Error generating schema meta:', error)
    throw error
  }
}
