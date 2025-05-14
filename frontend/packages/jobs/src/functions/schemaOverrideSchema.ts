import { type InferOutput, boolean, object, string } from 'valibot'

// Define evaluation schema using valibot
export const evaluationSchema = object({
  updateNeeded: boolean(),
  reasoning: string(),
  suggestedChanges: string(),
})

// Define type for evaluation result
export type EvaluationResult = InferOutput<typeof evaluationSchema>

export type GenerateSchemaOverrideResult =
  | {
      updateNeeded: true
      override: SchemaOverride
      reasoning: string
    }
  | {
      updateNeeded: false
      reasoning: string
    }

// Import SchemaOverride type from db-structure
import {
  type SchemaOverride,
  schemaOverrideSchema,
} from '@liam-hq/db-structure'
export { type SchemaOverride, schemaOverrideSchema }
