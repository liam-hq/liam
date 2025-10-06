import type { InferOutput } from 'valibot'
import type { hashSchema } from './schemas'

export type Hash = InferOutput<typeof hashSchema>
