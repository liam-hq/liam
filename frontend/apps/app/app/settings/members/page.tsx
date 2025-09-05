import { notFound, redirect } from 'next/navigation'
import { OrganizationMembersPage } from '../../../../../../components/OrganizationMembersPage'
import { getOrganizationId } from '../../../../../../features/organizations/services/getOrganizationId'
import { createClient } from '../../../../../../libs/db/server'
import { urlgen } from '../../../../../../libs/routes'

export default async function MembersPage() {
  const organizationIdResult = await getOrganizationId()
  if (organizationIdResult.isErr()) {
    redirect(urlgen('login'))
  }

  const organizationId = organizationIdResult.value

  const supabase = await createClient()

  const { data: organization, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single()

  if (error || !organization) {
    console.error('Error fetching organization:', error)
    notFound()
  }

  return <OrganizationMembersPage organization={organization} />
}
