'use server'

import { createOrganization } from '@/components/OrganizationNewPage/actions/createOrganizations'
import { generateOrganizationNameFromUser } from '@/features/organizations/services/generateOrganizationNameFromUser'
import { setOrganizationIdCookie } from '@/features/organizations/services/setOrganizationIdCookie'
import { createClient } from '@/libs/db/server'

export async function ensureUserHasOrganization() {
  const supabase = await createClient()

  // Check if user has an organization and create one if they don't
  const { data: userData } = await supabase.auth.getUser()
  if (userData?.user) {
    const { data: organizationMembers } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userData.user.id)
      .limit(1)

    // Auto-create organization if user doesn't have one
    if (!organizationMembers || organizationMembers.length === 0) {
      const organizationName = await generateOrganizationNameFromUser()
      if (organizationName) {
        const result = await createOrganization(organizationName)
        if (result.success) {
          await setOrganizationIdCookie(result.organizationId)
        }
      }
    }
  }
}
