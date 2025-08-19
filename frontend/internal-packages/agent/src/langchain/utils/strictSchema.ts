import type { JSONSchema } from '@langchain/core/utils/json_schema'

/**
 * Recursively adds additionalProperties: false to a JSON schema to make it compatible with OpenAI strict mode
 * @param schema - The JSON schema to modify
 * @returns The modified schema with additionalProperties: false added to all object types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeSchemaStrict(schema: any): JSONSchema {
  if (typeof schema !== 'object' || schema === null) {
    return schema
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const result = { ...schema }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (result.type === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    result.additionalProperties = false
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (result.properties && typeof result.properties === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    result.properties = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      Object.entries(result.properties).map(([key, value]) => [
        key,
        makeSchemaStrict(value),
      ]),
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (result.items) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (Array.isArray(result.items)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      result.items = result.items.map((item: any) => makeSchemaStrict(item))
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      result.items = makeSchemaStrict(result.items)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (result.oneOf && Array.isArray(result.oneOf)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    result.oneOf = result.oneOf.map((item: any) => makeSchemaStrict(item))
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (result.anyOf && Array.isArray(result.anyOf)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    result.anyOf = result.anyOf.map((item: any) => makeSchemaStrict(item))
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (result.allOf && Array.isArray(result.allOf)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    result.allOf = result.allOf.map((item: any) => makeSchemaStrict(item))
  }

  return result
}
