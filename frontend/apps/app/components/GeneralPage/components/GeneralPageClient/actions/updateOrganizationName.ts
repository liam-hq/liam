'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/libs/db/server'

/**
 * Update organization name
 */
export async function updateOrganizationName(
  organizationId: string,
  name: string,
): Promise<{
  success: boolean
  // eslint-disable-next-line no-restricted-syntax
  error?: string
}> {
  if (!name.trim()) {
    return { success: false, error: 'Organization name cannot be empty' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('organizations')
    .update({ name: name.trim() })
    .eq('id', organizationId)

  if (error) {
    console.error('Error updating organization:', error)
    return { success: false, error: 'Failed to update organization name' }
  }

  // Revalidate the organization pages to reflect the changes
  revalidatePath(`/app/organizations/${organizationId}`)
  revalidatePath(`/app/organizations/${organizationId}/settings/general`)

  return { success: true }
}
