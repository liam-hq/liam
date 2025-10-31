import { ResultAsync } from '@liam-hq/neverthrow'
import { Octokit } from '@octokit/rest'
import * as v from 'valibot'
import type { Installation } from './types'

type InstallationsResponse = {
  installations: Installation[]
  total_count?: number
}

// Minimal schema for validation only
const MinimalInstallationSchema = v.object({
  id: v.number(),
  account: v.object({ login: v.string() }),
})

const MinimalResponseSchema = v.object({
  installations: v.array(MinimalInstallationSchema),
  total_count: v.optional(v.number()),
})

/**
 * Fetch user installations with a user OAuth access token.
 * Does not depend on app/session types; token string only.
 */
export function getInstallations(
  token: string,
): ResultAsync<InstallationsResponse, Error> {
  return ResultAsync.fromPromise(
    (async () => {
      const octokit = new Octokit({
        auth: token,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      const res = await octokit.request('GET /user/installations')

      // Runtime sanity-check: ensure minimal expected shape
      const data = res.data
      const parsed = v.safeParse(MinimalResponseSchema, data)
      if (!parsed.success) {
        return Promise.reject(
          new Error('Unexpected installations response shape'),
        )
      }

      // Preserve original data shape while ensuring minimal structure exists
      return {
        installations: data.installations,
        total_count: data.total_count,
      } satisfies InstallationsResponse
    })(),
    (e) => (e instanceof Error ? e : new Error(String(e))),
  )
}
