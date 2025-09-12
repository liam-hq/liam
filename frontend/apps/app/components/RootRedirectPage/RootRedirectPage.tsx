import { redirect } from 'next/navigation'
import { createClient } from '../../libs/db/server'

export async function RootRedirectPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return redirect('/login?returnTo=/')
  }

  return redirect('/design_sessions/new')
}
