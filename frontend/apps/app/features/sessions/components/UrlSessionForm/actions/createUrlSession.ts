'use server'

import type { Schema } from '@liam-hq/schema'
import {
  createSessionWithSchema,
  parseSchemaContent,
} from '../../shared/services/sessionCreationHelpers'
import {
  type CreateSessionState,
  parseFormData,
  type SchemaFormat,
  UrlFormDataSchema,
} from '../../shared/validation/sessionFormValidation'
import { fetchSchemaFromUrl as fetchSchemaFromUrlUtil } from '../utils/urlValidation'

async function fetchSchemaFromUrl(
  url: string,
  format: SchemaFormat,
): Promise<Schema | CreateSessionState> {
  const result = await fetchSchemaFromUrlUtil(url)

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to fetch schema from URL',
    }
  }

  if (!result.content) {
    return { success: false, error: 'No content received from URL' }
  }

  return await parseSchemaContent(result.content, format)
}

export async function createUrlSession(
  _prevState: CreateSessionState,
  formData: FormData,
): Promise<CreateSessionState> {
  const parsedFormDataResult = parseFormData(formData, UrlFormDataSchema)
  if (!parsedFormDataResult.success) {
    return { success: false, error: 'Invalid form data' }
  }

  const {
    parentDesignSessionId,
    initialMessage,
    isDeepModelingEnabled,
    schemaUrl,
    schemaFormat,
  } = parsedFormDataResult.output

  const schemaResult = await fetchSchemaFromUrl(schemaUrl, schemaFormat)
  if ('success' in schemaResult) {
    return schemaResult
  }
  const schema = schemaResult

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
      schemaFilePath: schemaUrl,
    },
  )
}
