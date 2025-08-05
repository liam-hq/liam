import { Octokit } from '@octokit/rest'
import type { Session } from '@supabase/supabase-js'
import type { GetInstallationsResult } from './types'

export async function getInstallations(
  session: Session,
): Promise<GetInstallationsResult> {
  try {
    const octokit = new Octokit({
      auth: session.provider_token,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    const res = await octokit.request('GET /user/installations')

    return { installations: res.data.installations, error: null }
  } catch (error) {
    console.error('Error fetching GitHub installations:', error)
    return {
      installations: [],
      error:
        'Failed to fetch GitHub installations. Please check your GitHub authentication.',
    }
  }
}
