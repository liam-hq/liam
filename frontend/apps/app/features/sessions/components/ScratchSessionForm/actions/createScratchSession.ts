'use server'

import { createClient } from '../../../../../libs/db/server'
import { getOrganizationId } from '../../../../organizations/services/getOrganizationId'
import {
  BaseFormDataSchema,
  type CreateSessionState,
  parseFormData,
} from '../../shared/validation/sessionFormValidation'

const generateSessionName = (initialMessage: string): string => {
  const cleanMessage = initialMessage.trim().replace(/\s+/g, ' ')

  if (!cleanMessage || cleanMessage.length < 3) {
    return `Design Session - ${new Date().toISOString()}`
  }

  const truncated = cleanMessage.slice(0, 20)
  return truncated.length < cleanMessage.length ? `${truncated}...` : truncated
}

export async function createScratchSession(
  _prevState: CreateSessionState,
  formData: FormData,
): Promise<CreateSessionState> {
  const parsedFormDataResult = parseFormData(formData, BaseFormDataSchema)
  if (!parsedFormDataResult.success) {
    return { success: false, error: 'Invalid form data' }
  }

  const { parentDesignSessionId, initialMessage } = parsedFormDataResult.output

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData?.user?.id

  if (!currentUserId) {
    return { success: false, error: 'Authentication required' }
  }

  const { data: userInfo } = await supabase
    .from('users')
    .select('name')
    .eq('id', currentUserId)
    .single()

  if (!userInfo) {
    return { success: false, error: 'Could not fetch user info' }
  }

  const organizationIdResult = await getOrganizationId()
  if (organizationIdResult.isErr()) {
    return { success: false, error: organizationIdResult.error.message }
  }

  const organizationId = organizationIdResult.value

  const { data: designSession, error: insertError } = await supabase
    .from('design_sessions')
    .insert({
      name: generateSessionName(initialMessage),
      project_id: null,
      organization_id: organizationId,
      created_by_user_id: currentUserId,
      parent_design_session_id: parentDesignSessionId,
    })
    .select()
    .single()

  if (insertError || !designSession) {
    console.error('Error creating design session:', insertError)
    return { success: false, error: 'Failed to create design session' }
  }

  const redirectTo = `/design_sessions/${designSession.id}`

  return {
    success: true,
    designSessionId: designSession.id,
    redirectTo,
    userName: userInfo.name,
    initialMessage,
  }
}
