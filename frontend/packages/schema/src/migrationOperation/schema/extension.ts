import * as v from 'valibot'
import { extensionSchema } from '../../schema/schema.js'
import { PATH_PATTERNS } from '../constants.js'

// Add extension operation
const addExtensionOperation = v.object({
  op: v.literal('add'),
  path: v.pipe(
    v.string(),
    v.regex(PATH_PATTERNS.EXTENSION_BASE),
    v.description('Path to add extension (e.g., /extensions/vector)'),
  ),
  value: extensionSchema,
})

// Remove extension operation
const removeExtensionOperation = v.object({
  op: v.literal('remove'),
  path: v.pipe(
    v.string(),
    v.regex(PATH_PATTERNS.EXTENSION_BASE),
    v.description('Path to remove extension (e.g., /extensions/vector)'),
  ),
})

export const extensionOperations = [
  addExtensionOperation,
  removeExtensionOperation,
]
