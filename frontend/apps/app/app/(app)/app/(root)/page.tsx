import { createClient } from '@/libs/db/server'
import { urlgen } from '@/libs/routes'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect(urlgen('login'))
  }

  const { data: organizationMembers, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', data.user.id)
    .limit(1)

  if (orgError) {
    console.error('Error fetching organization members:', orgError)
  }

  if (!organizationMembers || organizationMembers.length === 0) {
    redirect(urlgen('organizations/new'))
  }

  const organizationId = organizationMembers[0].organization_id

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .eq('organization_id', organizationId)
    .limit(1)

  if (projectsError) {
    console.error('Error fetching projects:', projectsError)
  }

  if (projects && projects.length > 0) {
    redirect(urlgen('projects'))
  }

  redirect(urlgen('projects/new'))
}
