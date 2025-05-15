'use server'

import type { Schema } from '@liam-hq/db-structure'
import { overrideSchema, schemaOverrideSchema } from '@liam-hq/db-structure'
import { safeParse } from 'valibot'

export async function processOverrideContent(content: string, schema: Schema) {
  const parsedOverrideContent = safeParse(
    schemaOverrideSchema,
    JSON.parse(content),
  )

  if (!parsedOverrideContent.success) {
    return {
      result: null,
      error: {
        name: 'ValidationError',
        message: 'Failed to validate schema override file.',
        instruction:
          'Please ensure the override file is in the correct format.',
      },
    }
  }

  return {
    result: overrideSchema(schema, parsedOverrideContent.output),
    error: null,
  }
}
