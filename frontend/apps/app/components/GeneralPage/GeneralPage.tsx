import { notFound } from 'next/navigation'
import { GeneralPageClient } from './components/GeneralPageClient'
import { getOrganizationDetails } from './services/getOrganizationDetails'

export async function GeneralPage({
  organizationId,
}: {
  organizationId: string
}) {
  // Fetch organization details using the existing function
  const organization = await getOrganizationDetails(organizationId)

  if (!organization) {
    notFound()
  }

  // Use the client component with useActionState for toast notifications
  return <GeneralPageClient organization={organization} />
}
