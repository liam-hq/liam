'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/libs/db/server'

export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    redirect('/error')
  }

  redirect('/app/login')
}
