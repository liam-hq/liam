import { redirect } from 'next/navigation'
import { GeneralPage } from '@/components/GeneralPage'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { urlgen } from '@/libs/routes'

export default async function Page() {
  const organizationIdResult = await getOrganizationId()
  if (organizationIdResult.isErr()) {
    redirect(urlgen('login'))
  }

  const organizationId = organizationIdResult.value

  return <GeneralPage organizationId={organizationId} />
}
