import { redirect } from 'next/navigation'

import { createClient } from '@/libs/db/server'

export default async function PrivatePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/app/login')
  }

  return <p>Hello {data.user.email}</p>
}
