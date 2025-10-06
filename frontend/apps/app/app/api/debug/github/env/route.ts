import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 },
    )
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET
  const debug = process.env.GITHUB_OAUTH_DEBUG === 'true'

  const mask = (v?: string | null) =>
    typeof v === 'string' && v.length > 8
      ? `${v.slice(0, 4)}...${v.slice(-2)}`
      : (v ?? null)

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    clientIdMasked: mask(clientId),
    clientSecretMasked: mask(clientSecret),
    debug,
  })
}
