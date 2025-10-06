import { getInstallationsForUsername } from '@liam-hq/github'
import { redirect } from 'next/navigation'
import { ProjectNewPage } from '../../../components/ProjectNewPage'
import { getOrganizationId } from '../../../features/organizations/services/getOrganizationId'
import { createClient } from '../../../libs/db/server'
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

  if (data.session === null) {
    redirect(urlgen('login'))
  }

  // Derive GitHub username from Supabase user metadata (GitHub provider) without using `any`
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

  const usernameFromUserMetadata = (() => {
    const userMetadata = user.user_metadata as unknown
    if (isRecord(userMetadata)) {
      const userNameField = userMetadata['user_name']
      if (typeof userNameField === 'string') return userNameField
    }
    return undefined
  })()

  const usernameFromIdentities = (() => {
    const identities = Array.isArray(user.identities) ? user.identities : []
    const githubIdentity = identities.find(
      (identity) =>
        identity &&
        typeof identity.provider === 'string' &&
        identity.provider === 'github',
    )
    const identityData = githubIdentity?.identity_data as unknown
    if (isRecord(identityData)) {
      const userNameField = identityData['user_name']
      if (typeof userNameField === 'string') return userNameField
    }
    return undefined
  })()

  const githubLogin = usernameFromUserMetadata ?? usernameFromIdentities

  if (!githubLogin) {
    console.error('GitHub login not found on user metadata')
    redirect(urlgen('login'))
  }

  const { installations } = await getInstallationsForUsername(githubLogin)

  return (
    <ProjectNewPage
      installations={installations}
      organizationId={organizationId}
    />
  )
}
