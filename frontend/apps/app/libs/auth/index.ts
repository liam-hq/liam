/**
 * Utility functions for secure authentication in server and client components
 */

import { createClient as createServerClient } from '../db/server'
import { createClient as createClientClient } from '../db/client'

/**
 * Get authenticated user for server components
 * This is the secure way to check authentication in server components
 */
export async function getAuthenticatedUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get session data for GitHub API calls
 * NOTE: This should ONLY be used for GitHub API calls that require provider_token
 * and NOT for authentication checks in server components
 */
export async function getSessionForGitHubApi() {
  const supabase = await createServerClient()
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Get session data for client components
 * This is acceptable in client components
 */
export async function getClientSession() {
  const supabase = await createClientClient()
  const { data } = await supabase.auth.getSession()
  return data.session
}
