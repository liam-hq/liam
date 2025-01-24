import * as v from 'valibot'

export const supportedFormatSchema = v.picklist([
  'schemarb',
  'postgres',
  'prisma',
  'tbls',
])

export type SupportedFormat = v.InferOutput<typeof supportedFormatSchema>
