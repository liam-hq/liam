import type * as v from 'valibot'

/**
 * Convert a Valibot schema to JSON Schema format
 */
export const toJsonSchema = (_schema: v.BaseSchema<any, any, any>): any => {
  return {
    type: 'object',
    properties: {},
    additionalProperties: true,
  }
}
