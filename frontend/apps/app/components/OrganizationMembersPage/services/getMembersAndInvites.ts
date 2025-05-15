import { createClient } from '@/libs/db/server'

export const getOrganizationMembers = async (organizationId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      id,
      joined_at,

      users(
        id,
        name,
        email
      )
    `)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error fetching organization members:', error)
    return []
  }

  const members = data.map((member) => ({
    id: member.id,
    joinedAt: member.joined_at,
    user: member.users,
  }))

  return members
}

export const getOrganizationInvites = async (organizationId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invitations')
    .select(`
      id,
      email,
      invited_at,

      invite_by:invite_by_user_id(
        id,
        name,
        email
      )
    `)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error fetching organization invites:', error)
    return []
  }

  // Transform data to match expected Invite type
  const invites = data.map((invite) => ({
    id: invite.id,
    email: invite.email,
    invitedAt: invite.invited_at,
    inviteBy: invite.invite_by,
  }))

  return invites
}
