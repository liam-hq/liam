import { ProjectNewPage } from '@/components/ProjectNewPage'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'
import { getInstallations } from '@liam-hq/github'
import { redirect } from 'next/navigation'

export default async function NewProjectPage() {
  const organizationId = await getOrganizationId()

  // TODO: Reconsider what screen should be displayed to the user when organizationId is not available
  if (organizationId == null) {
    return null
  }

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    console.error('Error fetching user:', error)
    throw new Error('User not authenticated')
  }

  const { data } = await supabase.auth.getSession()

  if (data.session === null) {
    throw new Error('Session not found')
  }

  let installations
  try {
    const result = await getInstallations(data.session)
    installations = result.installations
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('authentication failed')
    ) {
      redirect('/auth/login')
    }
    throw error
  }

  return (
    <ProjectNewPage
      installations={installations}
      organizationId={organizationId}
    />
  )
}
