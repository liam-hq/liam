import { getFileContent } from '@liam-hq/github'
import { createClient } from '../libs/supabase'

type KnowledgeType = 'SCHEMA' | 'DOCS'

type CreateKnowledgeSuggestionPayload = {
  projectId: number
  type: KnowledgeType
  title: string
  path: string
  content: string
  branch: string
  traceId?: string
  reasoning?: string
  overallReviewId?: number
}

type CreateKnowledgeSuggestionResult = {
  suggestionId: number | null
  success: boolean
}

/**
 * Get repository information for a project
 */
const getRepositoryInfo = async (projectId: number) => {
  const supabase = createClient()

  const { data: project, error } = await supabase
    .from('Project')
    .select(`
      *,
      repositoryMappings:ProjectRepositoryMapping(
        *,
        repository:Repository(*)
      )
    `)
    .eq('id', projectId)
    .single()

  if (error || !project || !project.repositoryMappings?.[0]?.repository) {
    throw new Error('Repository information not found for the project')
  }

  const repository = project.repositoryMappings[0].repository
  return {
    owner: repository.owner,
    name: repository.name,
    installationId: Number(repository.installationId),
  }
}

type ContentCheckResult = {
  hasChanged: boolean
  docFilePath: { id: number } | null
}

/**
 * Check if content has changed for a DOCS type suggestion
 */
const hasContentChanged = async (
  projectId: number,
  path: string,
  existingContent: string | null,
  newContent: string,
): Promise<ContentCheckResult> => {
  const supabase = createClient()
  const { data: docFilePath } = await supabase
    .from('GitHubDocFilePath')
    .select('id')
    .eq('projectId', projectId)
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
  knowledgeSuggestionId: number,
  docFilePathId: number,
  timestamp: string,
) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('KnowledgeSuggestionDocMapping')
    .insert({
      knowledgeSuggestionId,
      gitHubDocFilePathId: docFilePathId,
      updatedAt: timestamp,
    })

  if (error) {
    console.error('Failed to create doc mapping:', error.message)
  }
}

/**
 * Create a mapping between OverallReview and KnowledgeSuggestion
 */
const createOverallReviewMapping = async (
  knowledgeSuggestionId: number,
  overallReviewId: number,
  timestamp: string,
) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('OverallReviewKnowledgeSuggestionMapping')
    .insert({
      knowledgeSuggestionId,
      overallReviewId,
      updatedAt: timestamp,
    })

  if (error) {
    console.error('Failed to create OverallReview mapping:', error.message)
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

  try {
    // Get repository information
    const repo = await getRepositoryInfo(projectId)
    const repositoryFullName = `${repo.owner}/${repo.name}`

    // Get the existing file content and SHA
    const existingFile = await getFileContent(
      repositoryFullName,
      path,
      branch,
      repo.installationId,
    )

    // Default to no docFilePath
    let docFilePath: { id: number } | null = null

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
      .from('KnowledgeSuggestion')
      .insert({
        type,
        title,
        path,
        content,
        fileSha: existingFile.sha,
        projectId,
        branchName: branch,
        traceId: traceId || null,
        reasoning: payload.reasoning || null,
        updatedAt: now,
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

    return {
      suggestionId: knowledgeSuggestion.id,
      success: true,
    }
  } catch (error) {
    console.error('Error in processCreateKnowledgeSuggestion:', error)
    throw error
  }
}
