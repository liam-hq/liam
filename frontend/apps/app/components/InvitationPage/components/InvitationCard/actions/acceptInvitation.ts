'use server'

import { setOrganizationIdCookie } from '@/features/organizations/services/setOrganizationIdCookie'
import { createClient } from '@/libs/db/server'
import { routeDefinitions } from '@/libs/routes/routeDefinitions'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as v from 'valibot'

// Define schema for form data validation
const acceptInvitationSchema = v.object({
  token: v.string('Token is required'),
})

// Define schema for RPC response validation
const acceptInvitationResultSchema = v.union([
  v.object({
    success: v.literal(true),
    organizationId: v.string(),
    error: v.null(),
  }),
  v.object({
    success: v.literal(false),
    organizationId: v.null(),
    error: v.string(),
  }),
])

/**
 * Server action to accept an organization invitation
 * Uses an atomic RPC function to handle all database operations in a single transaction
 */
export async function acceptInvitation(formData: FormData) {
  // Parse and validate form data
  const formDataObject = {
    token: formData.get('token'),
  }

  const parsedData = v.safeParse(acceptInvitationSchema, formDataObject)
  if (!parsedData.success) {
    return {
      success: false,
      error: `Invalid form data: ${parsedData.issues.map((issue) => issue.message).join(', ')}`,
    } as const
  }

  const { token } = parsedData.output
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return {
      success: false,
      error: 'User not authenticated or missing email',
    } as const
  }

  // Call the RPC function to handle the invitation acceptance atomically
  // Note: Type assertion is used here because the database.types.ts needs to be regenerated
  // after the migration is applied to include the new accept_invitation function
  const { data, error } = await supabase.rpc('accept_invitation', {
    p_token: token,
  })

  if (error) {
    console.error('Error accepting invitation:', JSON.stringify(error, null, 2))
    return {
      success: false,
      error: 'Failed to accept invitation. Please try again.',
    } as const
  }

  const result = v.safeParse(acceptInvitationResultSchema, data)
  if (!result.success) {
    return {
      success: false,
      error: `Invalid response from server: ${result.issues.map((issue) => issue.message).join(', ')}`,
    } as const
  }

  if (!result.output.success) {
    return result.output
  }
  const { organizationId } = result.output

  setOrganizationIdCookie(organizationId)

  // Revalidate relevant paths
  revalidatePath(routeDefinitions['projects'], 'page')

  // Redirect to the organization projects page
  redirect(routeDefinitions['projects'])
}
