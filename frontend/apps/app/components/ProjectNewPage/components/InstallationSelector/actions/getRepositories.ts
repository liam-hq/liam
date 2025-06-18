'use server'

import {
  getRepositoriesByInstallationId,
  type Repository,
} from '@liam-hq/github'
import * as v from 'valibot'

type GetRepositoriesState = {
  repositories: Repository[]
  loading: boolean
  error?: string
}

const FormDataSchema = v.object({
  installationId: v.pipe(v.string(), v.transform(Number)),
})

export async function getRepositories(
  _prevState: GetRepositoriesState,
  formData: FormData,
): Promise<GetRepositoriesState> {
  const rawData = {
    installationId: formData.get('installationId'),
  }

  const parseResult = v.safeParse(FormDataSchema, rawData)
  if (!parseResult.success) {
    return {
      repositories: [],
      loading: false,
      error: 'Invalid installation ID',
    }
  }

  const { installationId } = parseResult.output

  try {
    const data = await getRepositoriesByInstallationId(installationId)
    return { repositories: data.repositories, loading: false }
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return {
      repositories: [],
      loading: false,
      error: 'Failed to fetch repositories',
    }
  }
}
