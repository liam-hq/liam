import { ProjectsPage } from '@/components/ProjectsPage'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'

export default async function Page() {
  const organizationId = await getOrganizationId()

  // TODO: Reconsider what screen should be displayed to the user when organizationId is not available
  if (organizationId == null) {
    return null
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.error('Error fetching user:', error)
    throw new Error('User not authenticated')
  }
  if (data.session === null) {
    throw new Error('User not authenticated')
  }

  return <ProjectsPage organizationId={organizationId} />
}
