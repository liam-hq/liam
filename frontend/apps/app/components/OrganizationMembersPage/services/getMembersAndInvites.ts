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

  const membersWithAvatars = await Promise.all(
    data.map(async (member) => {
      const { data: authData } = await supabase.auth.admin.getUserById(
        member.users.id,
      )
      const avatarUrl = authData.user?.user_metadata?.avatar_url

      return {
        id: member.id,
        joinedAt: member.joined_at,
        user: {
          ...member.users,
          avatar_url: avatarUrl,
        },
      }
    }),
  )

  return membersWithAvatars
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
