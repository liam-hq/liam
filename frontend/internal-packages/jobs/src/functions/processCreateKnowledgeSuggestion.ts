import { getFileContent } from '@liam-hq/github'
import { createClient } from '../libs/supabase'

type KnowledgeType = 'SCHEMA' | 'DOCS'

type CreateKnowledgeSuggestionPayload = {
  projectId: string
  type: KnowledgeType
  title: string
  path: string
  content: string
  branch: string
  traceId?: string
  reasoning?: string
  overallReviewId?: string
  reviewFeedbackId?: string | null
}

type CreateKnowledgeSuggestionResult = {
  suggestionId: string | null
  success: boolean
}

/**
 * Get repository information for a project
 */
const getRepositoryInfo = async (projectId: string) => {
  const supabase = createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_repository_mappings(
        *,
        github_repositories(*)
      )
    `)
    .eq('id', projectId)
    .single()

  if (
    error ||
    !project ||
    !project.project_repository_mappings?.[0]?.github_repositories
  ) {
    throw new Error('Repository information not found for the project')
  }

  const repository = project.project_repository_mappings[0].github_repositories
  return {
    owner: repository.owner,
    name: repository.name,
    installationId: repository.github_installation_identifier,
  }
}

type ContentCheckResult = {
  hasChanged: boolean
  docFilePath: { id: string } | null
}

/**
 * Check if content has changed for a DOCS type suggestion
 */
const hasContentChanged = async (
  projectId: string,
  path: string,
  existingContent: string | null,
  newContent: string,
): Promise<ContentCheckResult> => {
  const supabase = createClient()
  const { data: docFilePath } = await supabase
    .from('doc_file_paths')
    .select('id')
    .eq('project_id', projectId)
    .eq('path', path)
    .maybeSingle()

  // If no existing content or no docFilePath, content is considered changed
  if (!existingContent || !docFilePath) {
    return {
      hasChanged: true,
      docFilePath,
    }
  }

  // Check if content is different
  const contentChanged =
    existingContent.length !== newContent.length ||
    existingContent !== newContent

  return {
    hasChanged: contentChanged,
    docFilePath,
  }
}

/**
 * Create a knowledge suggestion doc mapping
 */
const createDocMapping = async (
  knowledgeSuggestionId: string,
  docFilePathId: string,
  timestamp: string,
) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('knowledge_suggestion_doc_mappings')
    .insert({
      knowledge_suggestion_id: knowledgeSuggestionId,
      doc_file_path_id: docFilePathId,
      updated_at: timestamp,
    })

  if (error) {
    console.error('Failed to create doc mapping:', error.message)
  }
}

/**
 * Create a mapping between OverallReview and KnowledgeSuggestion
 */
const createOverallReviewMapping = async (
  knowledgeSuggestionId: string,
  overallReviewId: string,
  timestamp: string,
) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('overall_review_knowledge_suggestion_mappings')
    .insert({
      knowledge_suggestion_id: knowledgeSuggestionId,
      overall_review_id: overallReviewId,
      updated_at: timestamp,
    })

  if (error) {
    console.error('Failed to create OverallReview mapping:', error.message)
  }
}

/**
 * Create a mapping between ReviewFeedback and KnowledgeSuggestion
 */
const createReviewFeedbackMapping = async (
  knowledgeSuggestionId: string,
  reviewFeedbackId: string,
  timestamp: string,
) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('review_feedback_knowledge_suggestion_mappings')
    .insert({
      knowledge_suggestion_id: knowledgeSuggestionId,
      review_feedback_id: reviewFeedbackId,
      created_at: timestamp,
      updated_at: timestamp,
    })

  if (error) {
    console.error('Failed to create ReviewFeedback mapping:', error.message)
  }
}

/**
 * Process the creation of a knowledge suggestion
 * For DOCS type, checks if there's a corresponding GitHubDocFilePath entry and if content has changed
 */
export const processCreateKnowledgeSuggestion = async (
  payload: CreateKnowledgeSuggestionPayload,
): Promise<CreateKnowledgeSuggestionResult> => {
  const {
    projectId,
    type,
    title,
    path,
    content,
    branch,
    traceId,
    overallReviewId,
  } = payload

  // Get repository information
  const repo = await getRepositoryInfo(projectId)
  const repositoryFullName = `${repo.owner}/${repo.name}`

  // Get the existing file content and SHA
  const existingFile = await getFileContent(
    repositoryFullName,
    path,
    branch,
    Number(repo.installationId),
  )

  // Default to no docFilePath
  let docFilePath: { id: string } | null = null

  // For DOCS type, check if content has changed
  if (type === 'DOCS') {
    const contentCheck = await hasContentChanged(
      projectId,
      path,
      existingFile.content,
      content,
    )

    // Save docFilePath for later use
    docFilePath = contentCheck.docFilePath

    // If content hasn't changed, return early
    if (!contentCheck.hasChanged) {
      return {
        suggestionId: null,
        success: true,
      }
    }
  }

  // Create the knowledge suggestion
  const supabase = createClient()
  const now = new Date().toISOString()
  const { data: knowledgeSuggestion, error: createError } = await supabase
    .from('knowledge_suggestions')
    .insert({
      type,
      title,
      path,
      content,
      file_sha: existingFile.sha,
      project_id: projectId,
      branch_name: branch,
      trace_id: traceId || null,
      reasoning: payload.reasoning || null,
      updated_at: now,
    })
    .select()
    .single()

  if (createError || !knowledgeSuggestion) {
    throw new Error(
      `Failed to create knowledge suggestion: ${createError?.message || 'Unknown error'}`,
    )
  }

  // Create doc mapping if needed
  if (type === 'DOCS' && docFilePath) {
    await createDocMapping(knowledgeSuggestion.id, docFilePath.id, now)
  }

  // Create OverallReview mapping if overallReviewId is provided
  if (overallReviewId) {
    await createOverallReviewMapping(
      knowledgeSuggestion.id,
      overallReviewId,
      now,
    )
  }

  // Create ReviewFeedback mapping if reviewFeedbackId is provided
  if (payload.reviewFeedbackId) {
    await createReviewFeedbackMapping(
      knowledgeSuggestion.id,
      payload.reviewFeedbackId,
      now,
    )
  }

  return {
    suggestionId: knowledgeSuggestion.id,
    success: true,
  }
}
