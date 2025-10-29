import { getInstallations } from '@liam-hq/github'
import { okAsync } from '@liam-hq/neverthrow'
import { redirect } from 'next/navigation'
import { ProjectNewPage } from '../../../components/ProjectNewPage'
import { getOrganizationId } from '../../../features/organizations/services/getOrganizationId'
import { createClient } from '../../../libs/db/server'
import { getUserAccessToken } from '../../../libs/github/token'
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

  const tokenResult = await getUserAccessToken()

  const { installations, needsRefresh } = await tokenResult
    .asyncAndThen((token) => {
      if (!token) {
        return okAsync({
          installations: [],
          needsRefresh: true,
        })
      }
      return getInstallations(token).map((result) => ({
        installations: result.installations,
        needsRefresh: false,
      }))
    })
    .match(
      (v) => v,
      (e) => {
        console.error('Failed to get token or installations:', e)
        return { installations: [], needsRefresh: true }
      },
    )

  return (
    <ProjectNewPage
      installations={installations}
      organizationId={organizationId}
      needsRefresh={needsRefresh}
    />
  )
}
