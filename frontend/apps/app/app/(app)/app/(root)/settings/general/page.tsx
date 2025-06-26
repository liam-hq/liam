import { GeneralPage } from '@/components/GeneralPage'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'

export default async function Page() {
  const organizationId = await getOrganizationId()

  if (organizationId == null) {
    return null
  }

  return <GeneralPage organizationId={organizationId} />
}
