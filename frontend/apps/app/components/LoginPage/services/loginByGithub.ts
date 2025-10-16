'use server'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '../../../libs/db/server'
import { urlgen } from '../../../libs/routes/urlgen'
import { sanitizeReturnPath } from './validateReturnPath'

type OAuthProvider = 'github'

async function getAuthCallbackUrl({
  next = '/design_sessions/new',
  provider,
}: {
  next?: string
  provider: OAuthProvider
}): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host')

  let url: string

  // Production environment with custom domain handling
  if (process.env.SITE_URL && process.env.NODE_ENV === 'production') {
    // Check if accessed via app.liambx.com
    if (host === 'app.liambx.com') {
      url = 'https://app.liambx.com'
    } else {
      // Default to SITE_URL (liambx.com)
      url = `https://${process.env.SITE_URL}`
    }
  } else if (process.env.VERCEL_BRANCH_URL) {
    // Preview deployments
    url = `https://${process.env.VERCEL_BRANCH_URL}`
  } else {
    // Local development
    url = 'http://localhost:3001/'
  }

  url = url.endsWith('/') ? url : `${url}/`
  return `${url}auth/callback/${provider}?next=${encodeURIComponent(next)}`
}

export async function loginByGithub(formData: FormData) {
  const supabase = await createClient()

  // Get the returnTo path from the form data and sanitize it
  // This will be set by the login page which reads from the cookie
  const formReturnTo = formData.get('returnTo')
  const returnTo = sanitizeReturnPath(
    formReturnTo?.toString(),
    '/design_sessions/new',
  )

  // Clear the returnTo cookie since we've used it
  const cookieStore = await cookies()
  cookieStore.delete('returnTo')

  const redirectTo = await getAuthCallbackUrl({
    provider: 'github',
    next: returnTo,
  })

  const provider = 'github'
  const { error, data } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes: 'read:user',
    },
  })

  if (error) {
    console.error('GitHub OAuth initialization failed:', {
      error: error.message,
      redirectTo,
      timestamp: new Date().toISOString(),
    })
    redirect(urlgen('error'))
  }

  if (data.url) {
    redirect(data.url)
  }
}
