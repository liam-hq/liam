import { createClient } from '@/libs/db/server'

export const getCurrentOrganization = async (
  specificOrganizationId?: string,
) => {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) {
    console.error('Error fetching user:', userError)
    return null
  }

  let query = supabase
    .from('organization_members')
    .select(`
      organizations(
        id,
        name
      )
    `)
    .eq('user_id', userData.user.id)

  if (specificOrganizationId) {
    query = query.eq('organization_id', specificOrganizationId)
  }

  const { data: organizationMembers, error } = await query

  if (error) {
    console.error('Error fetching organizations:', error)
    return null
  }

  if (!organizationMembers || organizationMembers.length === 0) {
    return null
  }

  return organizationMembers[0].organizations
}

export const getUserOrganizations = async () => {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) {
    console.error('Error fetching user:', userError)
    return null
  }

  const { data: organizationMembers, error } = await supabase
    .from('organization_members')
    .select(`
      organizations(
        id,
        name
      )
    `)
    .eq('user_id', userData.user.id)

  if (error) {
    console.error('Error fetching organizations:', error)
    return null
  }

  return organizationMembers.map((item) => item.organizations)
}
