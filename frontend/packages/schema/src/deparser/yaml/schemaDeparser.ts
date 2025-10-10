import { fromThrowable } from '@liam-hq/neverthrow'
import yaml from 'yaml'
import type { Schema } from '../../schema/index.js'
import type { SchemaDeparser } from '../type.js'

const removeNullValues = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(removeNullValues)
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => [k, removeNullValues(v)]),
    )
  }
  return obj
}

export const yamlSchemaDeparser: SchemaDeparser = (schema: Schema) => {
  const cleanedSchema = removeNullValues(schema)
  return fromThrowable(
    () =>
      yaml.stringify(cleanedSchema, {
        defaultStringType: 'PLAIN',
        defaultKeyType: 'PLAIN',
        lineWidth: 0,
        minContentWidth: 0,
      }),
    (error) =>
      error instanceof Error
        ? error
        : new Error(`Failed to stringify YAML: ${String(error)}`),
  )()
}
