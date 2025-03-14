'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/libs/db/server'

type OAuthProvider = 'github'

function getAuthCallbackUrl({
  next = '/app',
  provider,
}: { next?: string; provider: OAuthProvider }): string {
  let url = process.env?.NEXT_PUBLIC_VERCEL_URL ?? 'http://localhost:3001/'
  url = url.startsWith('http') ? url : `https://${url}`
  url = url.endsWith('/') ? url : `${url}/`
  return `${url}app/auth/callback/${provider}?next=${encodeURIComponent(next)}`
}

export async function login() {
  const supabase = await createClient()

  const redirectTo = getAuthCallbackUrl({ provider: 'github' })
  console.info({ redirectTo, url: process.env?.NEXT_PUBLIC_VERCEL_URL })

  const provider = 'github'
  const { error, data } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })

  console.info({ error, data })

  if (error) {
    redirect('/error')
  }

  if (data.url) {
    redirect(data.url)
  }
}
