'use server'

import type { Schema } from '@liam-hq/schema'
import {
  createSessionWithSchema,
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
    return { success: false, error: 'Invalid form data' }
  }

  const {
    parentDesignSessionId,
    initialMessage,
    isDeepModelingEnabled,
    schemaContent,
    schemaFormat,
  } = parsedFormDataResult.output

  if (!schemaContent || schemaContent.trim() === '') {
    return { success: false, error: 'Please paste schema content' }
  }

  const schemaResult = await parseSchemaContent(schemaContent, schemaFormat)
  if ('success' in schemaResult) {
    return schemaResult
  }
  const schema: Schema = schemaResult

  return await createSessionWithSchema(
    {
      parentDesignSessionId,
      initialMessage,
      isDeepModelingEnabled,
      projectId: null,
      gitSha: null,
    },
    {
      schema,
      schemaFilePath: 'pasted-schema',
    },
  )
}
