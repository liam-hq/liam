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
    .from('membership_invites')
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
    .from('membership_invites')
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
  const { error: insertError } = await supabase
    .from('membership_invites')
    .insert({
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

  let dbOperationSuccess = false
  let operationType = ''

  if (existingInvite) {
    // Update existing invite (resend)
    try {
      await updateInvite(supabase, existingInvite.id)
      dbOperationSuccess = true
      operationType = 'updated'
    } catch (dbError) {
      console.error('Failed to update invitation record:', dbError)
      return {
        success: false,
        error: 'Failed to update invitation record. Please try again.',
      }
    }
  } else {
    // Create new invite
    const createResult = await createInvite(
      supabase,
      organizationId,
      email,
      userId,
    )
    if (createResult.success) {
      dbOperationSuccess = true
      operationType = 'created'
    } else {
      return {
        success: false,
        error:
          createResult.error ||
          'Failed to save invitation record. Please try again.',
      }
    }
  }

  // Send email invite only if the DB operation was successful
  if (dbOperationSuccess) {
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      // Optional: Add redirectTo if needed: { redirectTo: 'your-invite-accept-url' }
    )

    if (inviteError) {
      console.error('Failed to send invitation email:', inviteError.message)
      // Return an error indicating DB success but email failure
      return {
        success: false,
        error: `Invitation record ${operationType}, but failed to send email: ${inviteError.message}. Please try again or contact support.`,
      }
    }
  } else {
    // This case should ideally not be reached if DB operations are handled correctly above,
    // but added for safety.
    return {
      success: false,
      error: 'Failed to process invitation due to a database error.',
    }
  }

  revalidatePath(
    '/(app)/app/organizations/[organizationId]/settings/members',
    'page',
  )

  return { success: true }
}
