// Server-only GitHub token utilities: read access token from Cookie (no refresh in RSC)

import { fromPromise } from '@liam-hq/neverthrow'
import { readAccessToken } from './cookie'

const SAFETY_MS = 3 * 60 * 1000 // 3 minutes safety window
// No schema/refresh handling here; handled in Route Handler

function isExpiringSoon(expiresAtIso: string | null | undefined): boolean {
  if (!expiresAtIso) return true
  const t = new Date(expiresAtIso).getTime()
  if (Number.isNaN(t)) return true
  return Date.now() + SAFETY_MS >= t
}

// No refresh here; Route Handler performs refresh and cookie writes

export function getUserAccessToken() {
  return fromPromise(readAccessToken()).map((access) => {
    if (access && !isExpiringSoon(access.expiresAt)) {
      return access.token
    }
    // Do not refresh here; return null so callers decide how to refresh.
    return null
  })
}
