'use server'

import { createClient } from '@/libs/db/server'
import type { SupabaseClient } from '@/libs/db/server'
import { urlgen } from '@/libs/routes'
import { createOrUpdateFileContent } from '@liam-hq/github'
import { redirect } from 'next/navigation'
import * as v from 'valibot'

// Define schema for form data validation with transforms
const formDataSchema = v.object({
  suggestionId: v.pipe(v.string()),
  repositoryOwner: v.string(),
  repositoryName: v.string(),
  installationId: v.pipe(
    v.string(),
    v.transform((value) => Number(value)),
  ),
})

/**
 * Creates a mapping between a KnowledgeSuggestion and a GitHubDocFilePath
 */
const createMapping = async (
  supabase: SupabaseClient,
  knowledgeSuggestionId: string,
  gitHubDocFilePathId: string,
  updatedAt: string,
) => {
  const { error: mappingError } = await supabase
    .from('knowledge_suggestion_doc_mappings')
    .insert({
      knowledge_suggestion_id: knowledgeSuggestionId,
      doc_file_path_id: gitHubDocFilePathId,
      updated_at: updatedAt,
    })

  if (mappingError) {
    console.error('Failed to create mapping:', mappingError)
  }
}

/**
 * Handles the GitHubDocFilePath creation and mapping for a Doc Suggestion
 */
const handleDocFilePath = async (
  supabase: SupabaseClient,
  suggestion: { project_id: string; path: string; type: string },
  suggestionId: string,
) => {
  // Check if there's a GitHubDocFilePath entry for this path
  const { data: docFilePath } = await supabase
    .from('doc_file_paths')
    .select('id')
    .eq('project_id', suggestion.project_id)
    .eq('path', suggestion.path)
    .maybeSingle()

  if (!docFilePath) {
    // Create a new GitHubDocFilePath entry
    const now = new Date().toISOString()
    const { data: newDocFilePath, error: createDocError } = await supabase
      .from('doc_file_paths')
      .insert({
        path: suggestion.path,
        is_review_enabled: true,
        project_id: suggestion.project_id,
        updated_at: now,
      })
      .select()
      .single()

    if (createDocError || !newDocFilePath) {
      console.error('Failed to create GitHubDocFilePath entry:', createDocError)
    } else {
      // Create a mapping
      await createMapping(supabase, suggestionId, newDocFilePath.id, now)
    }
  } else {
    // Create a mapping if it doesn't exist
    const { data: existingMapping } = await supabase
      .from('knowledge_suggestion_doc_mappings')
      .select('id')
      .eq('knowledge_suggestion_id', suggestionId)
      .eq('github_doc_file_path_id', docFilePath.id)
      .maybeSingle()

    if (!existingMapping) {
      await createMapping(
        supabase,
        suggestionId,
        docFilePath.id,
        new Date().toISOString(),
      )
    }
  }
}

export const approveKnowledgeSuggestion = async (formData: FormData) => {
  // Parse and validate form data
  const formDataObject = {
    suggestionId: formData.get('suggestionId'),
    repositoryOwner: formData.get('repositoryOwner'),
    repositoryName: formData.get('repositoryName'),
    installationId: formData.get('installationId'),
  }

  const parsedData = v.safeParse(formDataSchema, formDataObject)

  if (!parsedData.success) {
    throw new Error(`Invalid form data: ${JSON.stringify(parsedData.issues)}`)
  }

  const { suggestionId, repositoryOwner, repositoryName, installationId } =
    parsedData.output

  const supabase = await createClient()

  // Get the knowledge suggestion
  const { data: suggestion, error: findError } = await supabase
    .from('knowledge_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single()

  if (findError || !suggestion) {
    throw new Error('Knowledge suggestion not found')
  }

  // Update the file on GitHub
  const repositoryFullName = `${repositoryOwner}/${repositoryName}`
  const result = await createOrUpdateFileContent(
    repositoryFullName,
    suggestion.path,
    suggestion.content,
    suggestion.title, // Use title as commit message
    installationId,
    suggestion.branch_name,
    suggestion.file_sha || undefined,
  )

  if (!result.success) {
    throw new Error('Failed to update file on GitHub')
  }

  // Update the knowledge suggestion with approvedAt
  const { error: updateError } = await supabase
    .from('knowledge_suggestions')
    .update({ approved_at: new Date().toISOString() })
    .eq('id', suggestionId)

  if (updateError) {
    throw new Error('Failed to update knowledge suggestion')
  }

  // If this is a DOCS type suggestion, handle GitHubDocFilePath creation and mapping
  if (suggestion.type === 'DOCS') {
    await handleDocFilePath(supabase, suggestion, suggestionId)
  }

  // Redirect back to the knowledge suggestion detail page
  redirect(
    urlgen(
      'projects/[projectId]/ref/[branchOrCommit]/knowledge-suggestions/[id]',
      {
        projectId: `${suggestion.project_id}`,
        branchOrCommit: suggestion.branch_name,
        id: `${suggestionId}`,
      },
    ),
  )
}
