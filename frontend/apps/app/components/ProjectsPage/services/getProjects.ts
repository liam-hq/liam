import { createClient } from '@/libs/db/server'

export const getProjects = async (organizationId?: string) => {
  const supabase = await createClient()

  let query = supabase
    .from('projects')
    .select(`
      id,
      name,
      created_at,
      updated_at,
      organization_id,
      project_repository_mappings:project_repository_mappings(
        repository:github_repositories(
          id,
          name,
          owner,
          github_installation_identifier
        )
      )
    `)
    .order('id', { ascending: false })

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data: projects, error } = await query

  if (error) {
    console.error('Error fetching projects:', error)
    return null
  }

  return projects
}
