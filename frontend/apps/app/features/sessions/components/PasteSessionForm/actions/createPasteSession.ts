'use server'

import {
  createSession,
  parseSchemaContent,
} from '../../shared/services/sessionCreationHelpers'
import {
  type CreateSessionState,
  PasteFormDataSchema,
  parseFormData,
} from '../../shared/validation/sessionFormValidation'

export async function createPasteSession(
  _prevState: CreateSessionState,
  formData: FormData,
): Promise<CreateSessionState> {
  const parsedFormDataResult = parseFormData(formData, PasteFormDataSchema)
  if (!parsedFormDataResult.success) {
    const errorMessages = parsedFormDataResult.issues
      .map((issue) => issue.message)
      .join(', ')
    return {
      success: false,
      error: `Validation failed: ${errorMessages}`,
    }
  }

  const {
    parentDesignSessionId,
    initialMessage,
    isDeepModelingEnabled,
    schemaContent,
    schemaFormat,
  } = parsedFormDataResult.output

  const schemaResult = await parseSchemaContent(schemaContent, schemaFormat)
  if ('success' in schemaResult) {
    return schemaResult
  }
  const schema = schemaResult

  return await createSession(
    {
      parentDesignSessionId,
      initialMessage,
      isDeepModelingEnabled,
      projectId: null,
      gitSha: null,
      schemaFilePath: 'pasted-schema',
    },
    {
      schema,
      schemaFilePath: null,
    },
  )
}
