import { createClient } from '@/libs/db/server'

export const getOrganizations = async () => {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) {
    console.error('Error fetching user:', userError)
    return null
  }

  const { data: organizations, error } = await supabase
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

  return organizations.map((item) => item.organizations)
}
