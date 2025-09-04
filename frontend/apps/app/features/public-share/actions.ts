'use server'

import { createClient, createPublicServerClient } from '../../libs/db/server'

export async function checkPublicShareStatus(designSessionId: string) {
  // Use public client for checking share status (no auth required)
  const supabase = await createPublicServerClient()

  const { error } = await supabase
    .from('public_share_settings')
    .select('design_session_id')
    .eq('design_session_id', designSessionId)
    .single()

  return { isPublic: !error }
}

export async function enablePublicShare(designSessionId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    return { success: false, error: 'Authentication required' }
  }

  // First check if the user has access to this design session
  const { data: session } = await supabase
    .from('design_sessions')
    .select('id')
    .eq('id', designSessionId)
    .single()

  if (!session) {
    return { success: false, error: 'Session not found' }
  }

  const { error } = await supabase
    .from('public_share_settings')
    .insert({ design_session_id: designSessionId })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, isPublic: true }
}

export async function disablePublicShare(designSessionId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    return { success: false, error: 'Authentication required' }
  }

  const { error } = await supabase
    .from('public_share_settings')
    .delete()
    .eq('design_session_id', designSessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, isPublic: false }
}
