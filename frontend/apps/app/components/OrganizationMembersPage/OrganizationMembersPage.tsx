import { createClient } from '@/libs/db/server'
import type { FC } from 'react'
import { ClientSearchWrapper } from './components/ClientSearchWrapper'
import {
  getOrganizationInvites,
  getOrganizationMembers,
} from './services/getMembersAndInvites'

interface OrganizationMembersPageProps {
  organization: {
    id: string
    name: string
  }
}

export const OrganizationMembersPage: FC<
  OrganizationMembersPageProps
> = async ({ organization }) => {
  const members = await getOrganizationMembers(organization.id)
  const invites = await getOrganizationInvites(organization.id)

  // Get current user
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user?.id) {
    throw new Error('User not authenticated')
  }

  const currentUserId = userData.user.id

  return (
    <ClientSearchWrapper
      members={members}
      invites={invites}
      organizationId={organization.id}
      currentUserId={currentUserId}
    />
  )
}
