import { redirect } from 'next/navigation'
import { ProjectsPage } from '../../../../../components/ProjectsPage'
import { getOrganizationId } from '../../../../../features/organizations/services/getOrganizationId'
import { createClient } from '../../../../../libs/db/server'
import { urlgen } from '../../../../../libs/routes'

export default async function Page() {
  const organizationIdResult = await getOrganizationId()
  if (organizationIdResult.isErr()) {
    redirect(urlgen('login'))
  }

  const organizationId = organizationIdResult.value

  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.error('Error fetching user:', error)
    redirect(urlgen('login'))
  }
  if (data.session === null) {
    redirect(urlgen('login'))
  }

  return <ProjectsPage organizationId={organizationId} />
}
