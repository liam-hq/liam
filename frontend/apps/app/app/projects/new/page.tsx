import type { Installation } from '@liam-hq/github'
import { redirect } from 'next/navigation'
import { ProjectNewPage } from '../../../components/ProjectNewPage'
import { getOrganizationId } from '../../../features/organizations/services/getOrganizationId'
import { createClient } from '../../../libs/db/server'
import { getUserInstallationsForCurrentUser } from '../../../libs/github/installations'
import { urlgen } from '../../../libs/routes'

export default async function NewProjectPage() {
  const organizationIdResult = await getOrganizationId()

  if (organizationIdResult.isErr()) {
    console.error('Failed to get organization ID:', organizationIdResult.error)
    redirect(urlgen('login'))
  }

  const organizationId = organizationIdResult.value

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    console.error('Error fetching user:', error)
    redirect(urlgen('login'))
  }

  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    redirect(urlgen('login'))
  }

  let installations: Installation[]
  try {
    const res = await getUserInstallationsForCurrentUser()
    installations = res.installations
  } catch (e) {
    console.error('Failed to fetch GitHub installations:', e)
    redirect(urlgen('login'))
  }

  return (
    <ProjectNewPage
      installations={installations}
      organizationId={organizationId}
    />
  )
}
