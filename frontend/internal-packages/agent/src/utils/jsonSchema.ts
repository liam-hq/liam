import type * as v from 'valibot'

export const toJsonSchema = (
  _schema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
): Record<string, unknown> => {
  return {
    type: 'object',
    properties: {},
    additionalProperties: true,
  }
}
