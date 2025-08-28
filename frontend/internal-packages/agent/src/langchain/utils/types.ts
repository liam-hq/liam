import type * as v from 'valibot'
import type { reasoningSchema } from './schema'

export type Reasoning = v.InferOutput<typeof reasoningSchema>
