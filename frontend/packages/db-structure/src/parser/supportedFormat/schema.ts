import * as v from 'valibot'

export const supportedFormatSchema = v.union([
  v.literal('schemarb'),
  v.literal('postgres'),
])

export type SupportedFormat = v.InferOutput<typeof supportedFormatSchema>
