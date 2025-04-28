import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { ProjectsPage } from '@/features/projects/pages'
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
    return null
  }
  if (data.session === null) {
    return null
  }

  return <ProjectsPage organizationId={organizationId} />
}
