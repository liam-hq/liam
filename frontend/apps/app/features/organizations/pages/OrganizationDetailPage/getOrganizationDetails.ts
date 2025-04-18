import { createClient } from '@/libs/db/server'

export const getOrganizationDetails = async (organizationId: string) => {
  const supabase = await createClient()

  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  return organization
}

export const getOrganizationMembers = async (organizationId: string) => {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('organization_members')
    .select(`
      id,

      users(
        id,
        name,
        email
      )
    `)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error fetching organization members:', error)
    return null
  }

  return members
}

export const getOrganizationInvites = async (organizationId: string) => {
  const supabase = await createClient()

  const { data: invites, error } = await supabase
    .from('invitations')
    .select(`
      id,
      email,

      invite_by_user_id(
        id,
        name,
        email
      )
    `)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error fetching organization invites:', error)
    return null
  }

  return invites
}
