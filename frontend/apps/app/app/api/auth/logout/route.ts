import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { NextResponse } from 'next/server'
import { clearTokens } from '../../../../libs/github/cookie'

export async function POST() {
  await fromAsyncThrowable(clearTokens)().match(
    () => undefined,
    () => undefined,
  )
  return NextResponse.json({ ok: true })
}
