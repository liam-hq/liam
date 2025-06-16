'use server'

import { createClient } from '@/libs/db/server'
import { urlgen } from '@/libs/routes'
import { analyzeRepositoryTask } from '@liam-hq/jobs'
import { redirect } from 'next/navigation'
import * as v from 'valibot'

// Define schema for RPC function response validation
const addProjectResultSchema = v.union([
  v.object({
    success: v.literal(true),
    project_id: v.string(),
    repository_id: v.string(),
  }),
  v.object({
    success: v.literal(false),
    error: v.string(),
  }),
])

export const addProject = async (formData: FormData) => {
  const projectName = formData.get('projectName') as string
  const repositoryName = formData.get('repositoryName') as string
  const repositoryOwner = formData.get('repositoryOwner') as string
  const installationId = formData.get('installationId') as string
  const organizationId = formData.get('organizationId') as string
  const repositoryIdentifier = formData.get('repositoryIdentifier') as string

  const supabase = await createClient()

  // Call the RPC function to handle project creation atomically
  const { data, error } = await supabase.rpc('add_project', {
    p_project_name: projectName,
    p_repository_name: repositoryName,
    p_repository_owner: repositoryOwner,
    p_installation_id: Number(installationId),
    p_repository_identifier: Number(repositoryIdentifier),
    p_organization_id: organizationId,
  })

  if (error) {
    console.error('Error creating project:', JSON.stringify(error, null, 2))
    throw new Error('Failed to create project. Please try again.')
  }

  const result = v.safeParse(addProjectResultSchema, data)
  if (!result.success) {
    throw new Error(
      `Invalid response from server: ${result.issues.map((issue) => issue.message).join(', ')}`,
    )
  }

  // Type narrowing for result.output
  if (!result.output.success) {
    throw new Error(result.output.error)
  }

  const { project_id, repository_id } = result.output

  // Trigger repository analysis in the background
  try {
    await analyzeRepositoryTask.trigger({
      projectId: project_id,
      repositoryId: repository_id,
      repositoryOwner,
      repositoryName,
      installationId: Number(installationId),
      organizationId,
    })
  } catch (error) {
    // Log the error but don't fail the project creation
    console.error('Failed to trigger repository analysis:', error)
  }

  redirect(urlgen('projects/[projectId]', { projectId: project_id }))
}
