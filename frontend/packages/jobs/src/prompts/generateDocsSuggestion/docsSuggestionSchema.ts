import { type InferOutput, boolean, object, optional, string } from 'valibot'

// Define a common evaluation object structure
const fileEvaluationSchema = object({
  updateNeeded: boolean(),
  reasoning: string(),
  suggestedChanges: string(),
})

// Evaluation schema to determine which files need updates
export const evaluationSchema = object({
  schemaPatterns: fileEvaluationSchema,
  schemaContext: fileEvaluationSchema,
  migrationPatterns: fileEvaluationSchema,
  migrationOpsContext: fileEvaluationSchema,
})

// Define a file content with reasoning structure that can be reused
const fileContentSchema = object({
  content: string(),
  reasoning: string(),
})

// Updated schema with optional fields that include content and reasoning
export const docsSuggestionSchema = object({
  schemaPatterns: optional(string()),
  schemaContext: optional(string()),
  migrationPatterns: optional(string()),
  migrationOpsContext: optional(string()),
})

// Define types for easier usage
export type EvaluationResult = InferOutput<typeof evaluationSchema>
export type FileContent = InferOutput<typeof fileContentSchema>
export type DocsSuggestion = InferOutput<typeof docsSuggestionSchema>
export type DocFileContentMap = Record<string, FileContent>
