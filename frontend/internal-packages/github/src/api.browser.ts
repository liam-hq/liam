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
