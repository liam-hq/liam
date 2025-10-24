import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { clearOrganizationIdCookie } from '../../../features/organizations/services/clearOrganizationIdCookie'
import { createClient } from '../../../libs/db/server'
import { clearTokens } from '../../../libs/github/cookie'

export async function POST() {
  const opClearOrg = await fromAsyncThrowable(clearOrganizationIdCookie)()
  const opClearTokens = await fromAsyncThrowable(clearTokens)()
  const opSupabaseSignout = await fromAsyncThrowable(async () => {
    const supabase = await createClient()
    await supabase.auth.signOut({ scope: 'global' })
  })()

  let hasError = false
  if (opClearOrg.isErr()) {
    hasError = true
    Sentry.captureException(opClearOrg.error, {
      tags: { area: 'logout_api', step: 'clear_org_cookie' },
    })
  }
  if (opClearTokens.isErr()) {
    hasError = true
    Sentry.captureException(opClearTokens.error, {
      tags: { area: 'logout_api', step: 'clear_tokens' },
    })
  }
  if (opSupabaseSignout.isErr()) {
    hasError = true
    Sentry.captureException(opSupabaseSignout.error, {
      tags: { area: 'logout_api', step: 'supabase_signout' },
    })
  }

  if (hasError) {
    return NextResponse.json(
      { ok: false, error: 'logout_failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
