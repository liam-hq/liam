'use server'

import * as v from 'valibot'
import { getOrganizationDetails } from '../services/organizationService'
import {
  deleteOrganization,
  updateOrganizationName,
} from './organizationActions'

// Type definition for action state
type ActionState =
  | { success: false; error: string; message?: undefined }
  | { success: true; message: string; error?: undefined }
  | { success: false; error: null; message: null }

// Validation schemas definition
const organizationIdSchema = v.pipe(
  v.string(),
  v.minLength(1, 'Organization ID is required'),
)

const organizationNameSchema = v.pipe(
  v.string(),
  v.minLength(1, 'Organization name cannot be empty'),
  v.transform((value) => value.trim()),
)

const confirmTextSchema = v.pipe(
  v.string(),
  v.minLength(1, 'Confirmation text is required'),
)

// Server actions for useActionState
export async function updateOrganizationAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Validate form data in a type-safe way
  const organizationIdResult = v.safeParse(
    organizationIdSchema,
    formData.get('organizationId'),
  )

  if (!organizationIdResult.success) {
    return { success: false, error: 'Invalid organization ID' }
  }

  const nameResult = v.safeParse(organizationNameSchema, formData.get('name'))

  if (!nameResult.success) {
    return { success: false, error: 'Organization name cannot be empty' }
  }

  try {
    const organizationId = organizationIdResult.output
    const name = nameResult.output

    const result = await updateOrganizationName(organizationId, name)

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to update organization name',
      }
    }

    return {
      success: true,
      message: 'Organization name has been successfully updated',
    }
  } catch (error) {
    console.error('Error updating organization:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function deleteOrganizationAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Validate form data in a type-safe way
  const organizationIdResult = v.safeParse(
    organizationIdSchema,
    formData.get('organizationId'),
  )

  if (!organizationIdResult.success) {
    return { success: false, error: 'Invalid organization ID' }
  }

  const confirmTextResult = v.safeParse(
    confirmTextSchema,
    formData.get('confirmText'),
  )

  if (!confirmTextResult.success) {
    return { success: false, error: 'Confirmation text is required' }
  }

  try {
    const organizationId = organizationIdResult.output
    const confirmText = confirmTextResult.output

    // Get the organization details to verify the name
    const organization = await getOrganizationDetails(organizationId)
    const organizationName = organization?.name
    if (!organization) {
      return { success: false, error: 'Organization not found' }
    }

    // Verify that the confirmation text matches the organization name
    if (confirmText !== organization.name) {
      return {
        success: false,
        error: 'Confirmation text does not match organization name',
      }
    }

    const result = await deleteOrganization(organizationId)

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete organization',
      }
    }

    return {
      success: true,
      message: `Organization "${organizationName}" has been deleted successfully`,
    }
  } catch (error) {
    console.error('Error deleting organization:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
