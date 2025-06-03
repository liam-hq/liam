import { Octokit } from '@octokit/rest'
import type { Session } from '@supabase/supabase-js'

export async function getInstallations(session: Session) {
  const octokit = new Octokit({
    auth: session.provider_token,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  const res = await octokit.request('GET /user/installations')

  return res.data
}

export async function getRepositoriesByInstallationId(
  session: Session,
  installationId: number,
) {
  const octokit = new Octokit({
    auth: session.provider_token,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  const res = await octokit.request(
    'GET /user/installations/{installation_id}/repositories',
    {
      installation_id: installationId,
      per_page: 100,
    },
  )

  return res.data
}
