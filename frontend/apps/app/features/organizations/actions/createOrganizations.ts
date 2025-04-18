'use server'

import { createClient } from '@/libs/db/server'

export type CreateOrganizationResult =
  | { success: true; organizationId: string }
  | { success: false; error: string }

export async function createOrganization(
  name: string,
): Promise<CreateOrganizationResult> {
  const supabase = await createClient()

  // NOTE: Since we are using the insert method of the Supabase client, we are not performing checks such as string length validation.
  // We should consider implementing constraints on the DB side using triggers, but this is not yet implemented as requirements are not finalized.
  // NOTE: We should consider using transactions for inserting both organization and organization_members.
  // However, if the organization insert fails, the organization_members insert will not be performed, so this is not a critical issue.

  // Create the organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({ name })
    .select('id')
    .single()

  if (orgError) {
    console.error('Error creating organization:', orgError)
    return { success: false, error: 'Failed to create organization' }
  }

  // Get the current user
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) {
    console.error('Error getting user:', userError)
    return { success: false, error: 'Failed to get user information' }
  }

  // Add the user to the organization
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      user_id: userData.user.id,
      organization_id: organization.id,
    })

  if (memberError) {
    console.error('Error adding user to organization:', memberError)
    return { success: false, error: 'Failed to add user to organization' }
  }

  return {
    success: true,
    organizationId: organization.id,
  }
}
