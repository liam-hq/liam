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
  UploadFormDataSchema,
} from '../../shared/validation/sessionFormValidation'

async function parseSchemaFromFile(
  file: File,
  format: SchemaFormat,
): Promise<Schema | CreateSessionState> {
  try {
    const content = await file.text()
    return await parseSchemaContent(content, format)
  } catch (error) {
    console.error('Error reading schema file:', error)
    return { success: false, error: 'Failed to read schema file' }
  }
}

export async function createUploadSession(
  _prevState: CreateSessionState,
  formData: FormData,
): Promise<CreateSessionState> {
  const parsedFormDataResult = parseFormData(formData, UploadFormDataSchema)
  if (!parsedFormDataResult.success) {
    return { success: false, error: 'Invalid form data' }
  }

  const {
    parentDesignSessionId,
    initialMessage,
    isDeepModelingEnabled,
    schemaFile,
    schemaFormat,
  } = parsedFormDataResult.output

  const schemaResult = await parseSchemaFromFile(schemaFile, schemaFormat)
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
      schemaFilePath: schemaFile.name,
    },
  )
}
