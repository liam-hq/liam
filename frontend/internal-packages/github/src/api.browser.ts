import { Octokit } from '@octokit/rest'
import type { Session } from '@supabase/supabase-js'

function isHttpError(error: unknown): error is { status: number } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  )
}

async function refreshSessionIfNeeded(session: Session): Promise<Session> {
  if (typeof window === 'undefined') {
    return session
  }

  const { createClient } = await import('../../../apps/app/libs/db/client')
  const supabase = createClient()

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: session.refresh_token,
  })

  if (error || !data.session) {
    throw new Error('Failed to refresh GitHub token. Please sign in again.')
  }

  return data.session
}

async function makeGitHubRequest<T>(
  session: Session,
  requestFn: (octokit: Octokit) => Promise<T>,
): Promise<T> {
  let currentSession = session

  const makeRequest = async (sessionToUse: Session): Promise<T> => {
    const octokit = new Octokit({
      auth: sessionToUse.provider_token,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    return await requestFn(octokit)
  }

  try {
    return await makeRequest(currentSession)
  } catch (error: unknown) {
    if (isHttpError(error) && error.status === 401) {
      try {
        currentSession = await refreshSessionIfNeeded(currentSession)
        return await makeRequest(currentSession)
      } catch (_refreshError) {
        throw new Error('GitHub authentication failed. Please sign in again.')
      }
    }
    throw error
  }
}

export async function getInstallations(session: Session) {
  return makeGitHubRequest(session, async (octokit) => {
    const res = await octokit.request('GET /user/installations')
    return res.data
  })
}

export async function getRepositoriesByInstallationId(
  session: Session,
  installationId: number,
) {
  return makeGitHubRequest(session, async (octokit) => {
    const res = await octokit.request(
      'GET /user/installations/{installation_id}/repositories',
      {
        installation_id: installationId,
        per_page: 100,
      },
    )
    return res.data
  })
}
