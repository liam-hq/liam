import { createClient } from '../../../../libs/db/server'

export async function getAuthUser() {
  const supabase = await createClient()

  return await supabase.auth.getUser()
}
