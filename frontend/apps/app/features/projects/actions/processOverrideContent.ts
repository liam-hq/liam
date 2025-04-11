'use server'

import type { DBStructure } from '@liam-hq/db-structure'
import { applyOverrides, dbOverrideSchema } from '@liam-hq/db-structure'
import { safeParse } from 'valibot'

export async function processOverrideContent(
  content: string,
  dbStructure: DBStructure,
) {
  const parsedOverrideContent = safeParse(dbOverrideSchema, JSON.parse(content))

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
    result: applyOverrides(dbStructure, parsedOverrideContent.output),
    error: null,
  }
}
