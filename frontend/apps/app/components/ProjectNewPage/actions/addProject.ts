'use server'

import { redirect } from 'next/navigation'
import * as v from 'valibot'
import { getOrganizationId } from '../../../features/organizations/services/getOrganizationId'
import { createClient } from '../../../libs/db/server'
import { urlgen } from '../../../libs/routes'

// Define schema for RPC function response validation
const addProjectResultSchema = v.union([
  v.object({
    success: v.literal(true),
    project_id: v.string(),
    repository_id: v.string(),
    schema_file_path_id: v.string(),
  }),
  v.object({
    success: v.literal(false),
    error: v.string(),
  }),
])

type AddProjectResult = {
  success: false
  error: string
}

export const addProject = async (
  formData: FormData,
): Promise<AddProjectResult | undefined> => {
  const projectName = formData.get('projectName') as string
  const repositoryName = formData.get('repositoryName') as string
  const repositoryOwner = formData.get('repositoryOwner') as string
  const installationId = formData.get('installationId') as string
  const repositoryIdentifier = formData.get('repositoryIdentifier') as string
  const schemaFilePath = formData.get('schemaFilePath') as string
  const schemaFormat = formData.get('schemaFormat') as string

  // Get organization ID
  const organizationIdResult = await getOrganizationId()
  if (organizationIdResult.isErr()) {
    return {
      success: false,
      error: organizationIdResult.error.message,
    }
  }
  const organizationId = organizationIdResult.value

  const supabase = await createClient()

  // Call the RPC function to handle project creation atomically
  const { data, error } = await supabase.rpc('add_project', {
    p_project_name: projectName,
    p_repository_name: repositoryName,
    p_repository_owner: repositoryOwner,
    p_installation_id: Number(installationId),
    p_repository_identifier: Number(repositoryIdentifier),
    p_organization_id: organizationId,
    p_schema_file_path: schemaFilePath,
    p_schema_format: schemaFormat,
  })

  if (error) {
    console.error('Error creating project:', JSON.stringify(error, null, 2))
    return {
      success: false,
      error: 'Failed to create project. Please try again.',
    }
  }

  const result = v.safeParse(addProjectResultSchema, data)
  if (!result.success) {
    return {
      success: false,
      error: `Invalid response from server: ${result.issues.map((issue) => issue.message).join(', ')}`,
    }
  }

  // Type narrowing for result.output
  if (!result.output.success) {
    return {
      success: false,
      error: result.output.error,
    }
  }

  const { project_id } = result.output

  redirect(urlgen('projects/[projectId]', { projectId: project_id }))
}
