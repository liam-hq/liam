'use server'

import { createClient } from '@/libs/db/server'
import { urlgen } from '@/libs/routes'
import { redirect } from 'next/navigation'

export const addProject = async (formData: FormData) => {
  // FIXME: Transaction management will use Supabase RPC in the future
  const projectName = formData.get('projectName') as string
  const repositoryName = formData.get('repositoryName') as string
  const repositoryOwner = formData.get('repositoryOwner') as string
  const installationId = formData.get('installationId') as string
  const organizationId = formData.get('organizationId') as string
  const repositoryIdentifier = formData.get('repositoryIdentifier') as string

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      name: projectName,
      created_at: now,
      updated_at: now,
      ...(organizationId ? { organization_id: organizationId } : {}),
    })
    .select()
    .single()

  if (projectError || !project) {
    throw new Error('Failed to create project')
  }

  // Create repository
  const { data: repository, error: repositoryError } = await supabase
    .from('github_repositories')
    .insert({
      name: repositoryName,
      owner: repositoryOwner,
      github_installation_identifier: Number(installationId),
      github_repository_identifier: Number(repositoryIdentifier),
      organization_id: organizationId,
      updated_at: now,
    })
    .select()
    .single()

  if (repositoryError || !repository) {
    throw new Error('Failed to create repository')
  }

  // Create project-repository mapping
  const { error: mappingError } = await supabase
    .from('project_repository_mappings')
    .insert({
      project_id: project.id,
      repository_id: repository.id,
      updated_at: now,
    })

  if (mappingError) {
    throw new Error('Failed to create project-repository mapping')
  }

  redirect(urlgen('projects/[projectId]', { projectId: `${project.id}` }))
}
