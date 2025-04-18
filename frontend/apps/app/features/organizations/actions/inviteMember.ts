'use server'

import { createClient } from '@/libs/db/server'
import type { SupabaseClient } from '@/libs/db/server'
import { revalidatePath } from 'next/cache'
import * as v from 'valibot'

// Define schema for form data validation
const inviteFormSchema = v.object({
  email: v.pipe(
    v.string(),
    v.email('Please enter a valid email address'),
    v.transform((value) => value.toLowerCase()),
  ),
  organizationId: v.string(),
})

/**
 * Checks if a user is already a member of the organization
 */
const checkExistingMember = async (
  supabase: SupabaseClient,
  organizationId: string,
  email: string,
): Promise<boolean> => {
  const { data: existingMembers } = await supabase
    .from('organization_members')
    .select('id, users(email)')
    .eq('organization_id', organizationId)

  return (
    existingMembers?.some(
      (member) => member.users?.email?.toLowerCase() === email.toLowerCase(),
    ) || false
  )
}

/**
 * Checks if an invitation already exists for the email and organization
 */
const checkExistingInvite = async (
  supabase: SupabaseClient,
  organizationId: string,
  email: string,
) => {
  const { data: existingInvites } = await supabase
    .from('invitations')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('email', email.toLowerCase())

  return existingInvites && existingInvites.length > 0
    ? existingInvites[0]
    : null
}

/**
 * Updates an existing invitation (resend)
 */
const updateInvite = async (
  supabase: SupabaseClient,
  inviteId: string,
): Promise<void> => {
  await supabase
    .from('invitations')
    .update({ invited_at: new Date().toISOString() })
    .eq('id', inviteId)
}

/**
 * Creates a new invitation
 */
const createInvite = async (
  supabase: SupabaseClient,
  organizationId: string,
  email: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> => {
  const { error: insertError } = await supabase.from('invitations').insert({
    organization_id: organizationId,
    email: email.toLowerCase(),
    invite_by_user_id: userId,
    invited_at: new Date().toISOString(),
  })

  if (insertError) {
    return {
      success: false,
      error: insertError.message,
    }
  }

  return { success: true }
}

/**
 * Server action to invite a member to an organization
 */
export const inviteMember = async (formData: FormData) => {
  // Parse and validate form data
  const formDataObject = {
    email: formData.get('email'),
    organizationId: formData.get('organizationId'),
  }

  const parsedData = v.safeParse(inviteFormSchema, formDataObject)

  if (!parsedData.success) {
    return {
      success: false,
      error: `Invalid form data: ${parsedData.issues.map((issue) => issue.message).join(', ')}`,
    }
  }

  const { email, organizationId } = parsedData.output
  const supabase = await createClient()

  // Get current user
  const currentUser = await supabase.auth.getUser()
  const userId = currentUser.data.user?.id

  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated',
    }
  }

  // Check if user is already a member
  const isAlreadyMember = await checkExistingMember(
    supabase,
    organizationId,
    email,
  )

  if (isAlreadyMember) {
    return {
      success: false,
      error: 'This user is already a member of the organization',
    }
  }

  // Check if invitation already exists
  const existingInvite = await checkExistingInvite(
    supabase,
    organizationId,
    email,
  )

  if (existingInvite) {
    // Update existing invite (resend)
    await updateInvite(supabase, existingInvite.id)
    return { success: true }
  }

  // Create new invite
  const createResult = await createInvite(
    supabase,
    organizationId,
    email,
    userId,
  )
  if (!createResult.success) {
    return {
      success: false,
      error:
        createResult.error || 'Failed to send invitation. Please try again.',
    }
  }

  // TODO: Send email to user

  revalidatePath(
    '/(app)/app/organizations/[organizationId]/settings/members/page.tsx',
    'page',
  )

  return { success: true }
}
