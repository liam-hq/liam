'use server'
import { createClient } from '@/libs/db/server'
import { redirect } from 'next/navigation'
import * as v from 'valibot'

// Define schema for RPC response validation
const getInvitationDataResultSchema = v.union([
  v.object({
    organizationName: v.nullable(v.string()),
  }),
])

/**
 * Server action to get invitation data for a specific organization
 * Fetches the invitation and organization data for the current user
 */
export async function getInvitationData(token: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login if not authenticated
    redirect('/app/login')
  }
  const currentUser = {
    id: user.id,
    email: user.email,
  }

  // Get invitation and organization data using RPC function
  const { data, error } = await supabase.rpc('get_invitation_data', {
    p_token: token,
  })
  if (error) {
    console.error('Error get invitation data:', JSON.stringify(error, null, 2))
  }
  const result = v.safeParse(getInvitationDataResultSchema, data)
  if (!result.success) {
    console.error(
      `Invalid response from server: ${result.issues.map((issue) => issue.message).join(', ')}`,
    )
    return {
      organizationName: null,
      currentUser,
    }
  }
  const { organizationName } = result.output
  return { organizationName, currentUser }
}
