'use server'

import { createClient } from '@/libs/db/server'

/**
 * Get organization details by ID
 *
 * @param organizationId - ID of the organization to retrieve
 * @returns Organization details or null if not found
 */
export async function getOrganizationDetails(
  organizationId: string,
): Promise<{ id: string; name: string } | null> {
  if (!organizationId) {
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single()

  if (error || !data) {
    console.error('Error fetching organization details:', error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
  }
}
