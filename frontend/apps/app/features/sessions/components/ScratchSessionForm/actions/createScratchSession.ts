'use server'

import { createSession } from '../../shared/services/sessionCreationHelpers'
import {
  BaseFormDataSchema,
  type CreateSessionState,
  parseFormData,
} from '../../shared/validation/sessionFormValidation'

export async function createScratchSession(
  _prevState: CreateSessionState,
  formData: FormData,
): Promise<CreateSessionState> {
  const parsedFormDataResult = parseFormData(formData, BaseFormDataSchema)
  if (!parsedFormDataResult.success) {
    return { success: false, error: 'Invalid form data' }
  }

  const { parentDesignSessionId, initialMessage, isDeepModelingEnabled } =
    parsedFormDataResult.output

  return createSession({
    parentDesignSessionId,
    initialMessage,
    isDeepModelingEnabled: isDeepModelingEnabled ?? true,
    projectId: null,
    schemaFilePath: null,
    gitSha: null,
  })
}
