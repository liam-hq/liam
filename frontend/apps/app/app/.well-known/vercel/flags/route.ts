import * as flags from '@/libs/flags'
import { type ApiData, verifyAccess } from 'flags'
import { getProviderData } from 'flags/next'
import { type NextRequest, NextResponse } from 'next/server'

// @see: https://vercel.com/docs/feature-flags/implement-flags-in-toolbar
export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get('Authorization'))
  if (!access) {
    return NextResponse.json(null, { status: 401 })
  }

  const providerData = getProviderData(flags)
  return NextResponse.json<ApiData>(providerData)
}
