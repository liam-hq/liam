'use server'

import { createClient } from '@/libs/db/server'

export async function generateOrganizationNameFromUser(): Promise<
  string | null
> {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    console.error('Error getting user:', userError)
    return null
  }

  let username = ''
  if (userData.user.user_metadata?.full_name) {
    username = userData.user.user_metadata.full_name
  } else if (userData.user.user_metadata?.name) {
    username = userData.user.user_metadata.name
  } else if (userData.user.email) {
    username = userData.user.email.split('@')[0]
  } else {
    username = 'User'
  }

  return `${username}'s Organization`
}
