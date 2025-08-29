import * as v from 'valibot'
import { extensionSchema } from '../../schema/schema.js'
import { PATH_PATTERNS } from '../constants.js'
import type { Operation } from './index.js'

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

export type AddExtensionOperation = v.InferOutput<typeof addExtensionOperation>
export type RemoveExtensionOperation = v.InferOutput<
  typeof removeExtensionOperation
>

export const isAddExtensionOperation = (
  operation: Operation,
): operation is AddExtensionOperation => {
  return v.safeParse(addExtensionOperation, operation).success
}

export const isRemoveExtensionOperation = (
  operation: Operation,
): operation is RemoveExtensionOperation => {
  return v.safeParse(removeExtensionOperation, operation).success
}

export const extensionOperations = [
  addExtensionOperation,
  removeExtensionOperation,
]
