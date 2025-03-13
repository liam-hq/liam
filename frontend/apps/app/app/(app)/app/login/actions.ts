'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/libs/db/server'

type OAuthProvider = 'github'

function getAuthCallbackUrl({
  next = '/app',
  provider,
}: { next?: string; provider: OAuthProvider }): string {
  let url = process.env.VERCEL_URL ?? 'http://localhost:3001/'
  url = url.endsWith('/') ? url : `${url}/`
  return `${url}app/auth/callback/${provider}?next=${encodeURIComponent(next)}`
}

export async function login() {
  const supabase = await createClient()

  const redirectTo = getAuthCallbackUrl({ provider: 'github' })

  const provider = 'github'
  const { error, data } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })

  if (error) {
    redirect('/error')
  }

  if (data.url) {
    redirect(data.url)
  }
}
