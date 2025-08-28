import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { cookies } from 'next/headers'
import { ORGANIZATION_ID_KEY } from '../constants'

export function getOrganizationIdFromCookie(): ResultAsync<string, null> {
  return ResultAsync.fromSafePromise(cookies()).andThen((cookieStore) => {
    const cookie = cookieStore.get(ORGANIZATION_ID_KEY)
    return cookie?.value ? okAsync(cookie.value) : errAsync(null)
  })
}
