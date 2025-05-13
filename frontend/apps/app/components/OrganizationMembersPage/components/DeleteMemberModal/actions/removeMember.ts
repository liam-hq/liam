'use server'

import { createClient } from '@/libs/db/server'
import { revalidatePath } from 'next/cache'
import { object, safeParse, string } from 'valibot'

const RemoveMemberSchema = object({
  memberId: string(),
  organizationId: string(),
})

export async function removeMember(formData: FormData) {
  // Use safeParse to validate the form data
  const result = safeParse(RemoveMemberSchema, {
    memberId: formData.get('memberId'),
    organizationId: formData.get('organizationId'),
  })

  if (!result.success) {
    return {
      success: false,
      error: 'Missing required fields',
    }
  }

  const { memberId, organizationId } = result.output

  const supabase = await createClient()

  // Delete the organization member
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error removing organization member:', error)
    return {
      success: false,
      error: error?.message || 'Failed to remove member',
    }
  }

  revalidatePath(`/app/organizations/${organizationId}/members`)

  return {
    success: true,
  }
}
