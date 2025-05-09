import { OrganizationMembersPage } from '@/components/OrganizationMembersPage'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'

export default async function MembersPage() {
  const organizationId = await getOrganizationId()

  // TODO: Reconsider what screen should be displayed to the user when organizationId is not available
  if (organizationId == null) {
    return null
  }

  const supabase = await createClient()

  const { data: organization, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single()

  if (error || !organization) {
    console.error('Error fetching organization:', error)
    throw new Error('Organization not found')
  }

  return <OrganizationMembersPage organization={organization} />
}
