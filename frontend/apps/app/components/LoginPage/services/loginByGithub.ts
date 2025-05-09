'use server'
import { cookies } from 'next/headers'
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

export async function loginByGithub(formData: FormData) {
  const supabase = await createClient()

  // Get the returnTo path from the form data
  // This will be set by the login page which reads from the cookie
  const formReturnTo = formData.get('returnTo')
  const returnTo = formReturnTo ? formReturnTo.toString() : '/app'

  // Clear the returnTo cookie since we've used it
  const cookieStore = await cookies()
  cookieStore.delete('returnTo')

  const redirectTo = getAuthCallbackUrl({
    provider: 'github',
    next: returnTo,
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
