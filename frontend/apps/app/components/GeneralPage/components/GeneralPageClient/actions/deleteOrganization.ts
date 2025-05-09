'use server'

import { createClient } from '@/libs/db/server'

/**
 * Delete organization
 */
export async function deleteOrganization(
  organizationId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId)

  if (error) {
    console.error('Error deleting organization:', error)
    return { success: false, error: 'Failed to delete organization' }
  }

  return { success: true }
}
