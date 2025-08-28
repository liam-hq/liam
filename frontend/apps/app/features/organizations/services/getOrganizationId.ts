import { toResultAsync } from '@liam-hq/db'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { createClient } from '@/libs/db/server'
import { getOrganizationIdFromCookie } from './getOrganizationIdFromCookie'

const getOrganizationIdFromDatabase = (): ResultAsync<string, Error> => {
  return ResultAsync.fromSafePromise(createClient()).andThen((supabase) =>
    ResultAsync.fromPromise(
      supabase.auth.getUser(),
      (e) => new Error(`Failed to get user: ${e}`),
    )
      .andThen(({ data, error }) => {
        if (error || !data?.user) {
          return errAsync(new Error('Authentication failed'))
        }
        return okAsync(data.user)
      })
      .andThen((user) => {
        return toResultAsync<{ organization_id: string } | null>(
          supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle(),
        )
      })
      .andThen((member) =>
        member?.organization_id
          ? okAsync(member.organization_id)
          : errAsync(new Error('No organization member found')),
      ),
  )
}

export function getOrganizationId(): ResultAsync<string, Error> {
  return getOrganizationIdFromCookie().orElse(() =>
    getOrganizationIdFromDatabase(),
  )
}
