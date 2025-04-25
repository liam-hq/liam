'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/libs/db/server'

type OAuthProvider = 'github'

function getAuthCallbackUrl({
  next = '/app',
  provider,
}: { next?: string; provider: OAuthProvider }): string {
  let url = process.env.SITE_URL
    ? `https://${process.env.SITE_URL}`
    : process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : 'http://localhost:3001/'
  url = url.endsWith('/') ? url : `${url}/`
  return `${url}app/auth/callback/${provider}?next=${encodeURIComponent(next)}`
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Get the returnTo path from the form data
  const returnTo = String(formData.get('returnTo') || '/app')

  const redirectTo = getAuthCallbackUrl({
    provider: 'github',
    next: returnTo, // Use the returnTo path here
  })

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
