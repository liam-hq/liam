'use server'

import { createClient } from '@/libs/db/server'
import { revalidatePath } from 'next/cache'
import { object, safeParse, string } from 'valibot'

const RemoveInvitationSchema = object({
  invitationId: string(),
  organizationId: string(),
})

export async function removeInvitation(formData: FormData) {
  // Use safeParse to validate the form data
  const result = safeParse(RemoveInvitationSchema, {
    invitationId: formData.get('invitationId'),
    organizationId: formData.get('organizationId'),
  })

  if (!result.success) {
    return {
      success: false,
      error: 'Missing required fields',
    }
  }

  const { invitationId, organizationId } = result.output
  const supabase = await createClient()

  // Delete the invitation
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)

  if (error) {
    console.error('Error removing invitation:', error)
    return {
      success: false,
      error: 'Failed to remove invitation',
    }
  }

  revalidatePath(`/app/organizations/${organizationId}/members`)

  return {
    success: true,
  }
}
