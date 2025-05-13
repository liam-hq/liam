'use server'
import { redirect } from 'next/navigation'

import { createClient } from '@/libs/db/server'

export async function loginByEmail(formData: FormData) {
  const supabase = await createClient()

  // Get the returnTo path from the form data
  // This will be set by the login page which reads from the cookie
  const formReturnTo = formData.get('returnTo')
  const returnTo = formReturnTo ? formReturnTo.toString() : '/app'

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  redirect(returnTo)
}
