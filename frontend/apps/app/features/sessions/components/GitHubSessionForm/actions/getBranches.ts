'use server'

import { type GitHubBranch, getRepositoryBranches } from '@liam-hq/github'
import * as v from 'valibot'
import { createClient } from '../../../../../libs/db/server'

type GetBranchesState = {
  branches: GitHubBranch[]
  loading: boolean
  error?: string
}

const FormDataSchema = v.object({
  projectId: v.string(),
})

const repositoryMappingSchema = v.object({
  github_repositories: v.object({
    github_installation_identifier: v.number(),
    owner: v.string(),
    name: v.string(),
  }),
})

export async function getBranches(
  _prevState: GetBranchesState,
  formData: FormData,
): Promise<GetBranchesState> {
  const rawData = {
    projectId: formData.get('projectId'),
  }

  const parseResult = v.safeParse(FormDataSchema, rawData)
  if (!parseResult.success) {
    return { branches: [], loading: false, error: 'Invalid project ID' }
  }

  const { projectId } = parseResult.output

  if (!projectId) {
    return { branches: [], loading: false }
  }

  const supabase = await createClient()
  const { data: mapping, error } = await supabase
    .from('project_repository_mappings')
    .select(`
      github_repositories(
        id, name, owner, github_installation_identifier
      )
    `)
    .eq('project_id', projectId)
    .single()

  if (error || !mapping) {
    console.error('Error fetching branches', error)
    return {
      branches: [],
      loading: false,
      error: 'Failed to fetch project information',
    }
  }

  const parsedMapping = v.safeParse(repositoryMappingSchema, mapping)
  if (!parsedMapping.success) {
    console.error('Invalid repository mapping data', parsedMapping.issues)
    return {
      branches: [],
      loading: false,
      error: 'Failed to parse repository information',
    }
  }

  const repository = parsedMapping.output.github_repositories
  const branches = await getRepositoryBranches(
    repository.github_installation_identifier,
    repository.owner,
    repository.name,
  )

  branches.sort((a, b) => {
    if (a.isProduction && !b.isProduction) return -1
    if (!a.isProduction && b.isProduction) return 1

    return a.name.localeCompare(b.name)
  })

  return { branches, loading: false }
}
