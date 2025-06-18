'use server'

import { getRepositoryBranches } from '@liam-hq/github'
import * as v from 'valibot'
import { createClient } from '@/libs/db/server'

type BranchWithSha = {
  name: string
  protected: boolean
  sha: string
}

type GetBranchesState = {
  branches: BranchWithSha[]
  loading: boolean
  error?: string
}

const FormDataSchema = v.object({
  projectId: v.string(),
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

  const repository = mapping.github_repositories
  const branches = await getRepositoryBranches(
    Number(repository.github_installation_identifier),
    repository.owner,
    repository.name,
  )

  const branchesWithSha: BranchWithSha[] = branches.map((branch) => ({
    name: branch.name,
    protected: branch.protected,
    sha: branch.commit.sha,
  }))

  return { branches: branchesWithSha, loading: false }
}
