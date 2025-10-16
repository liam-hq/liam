import { fromPromise } from '@liam-hq/neverthrow'
import { Octokit } from '@octokit/rest'
import type { Session } from '@supabase/supabase-js'
import { err } from 'neverthrow'

export async function getInstallations(session: Session) {
  if (!session.provider_token) {
    return err(
      new Error(
        'GitHub provider token is missing. Please sign in again with GitHub.',
      ),
    )
  }

  const octokit = new Octokit({
    auth: session.provider_token,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  const result = await fromPromise(
    octokit.request('GET /user/installations'),
    (error) =>
      error instanceof Error
        ? error
        : new Error('Failed to fetch GitHub installations'),
  )

  if (result.isErr()) {
    return err(result.error)
  }

  return result.map((res) => res.data)
}
