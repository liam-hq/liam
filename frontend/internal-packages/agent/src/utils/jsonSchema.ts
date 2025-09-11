import type { JSONSchema } from '@langchain/core/utils/json_schema'
import { toJsonSchema as valibotToJsonSchema } from '@valibot/to-json-schema'
import type { BaseIssue, BaseSchema } from 'valibot'
import { applyOpenAISchemaRequirements } from './applyOpenAiSchemaRequirements'

/**
 * Converts a Valibot schema to a JSONSchema format compatible with LangChain.
 *
 * This is a wrapper around @valibot/to-json-schema that handles the type
 * conversion from JSONSchema7 to the more general JSONSchema type expected
 * by LangChain tools. It also applies all OpenAI Structured Outputs requirements
 * for strict mode compatibility.
 */
export function toJsonSchema<
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(schema: TSchema): JSONSchema {
  const jsonSchema = valibotToJsonSchema(schema)
  // Apply all OpenAI strict mode requirements
  const strictSchema = applyOpenAISchemaRequirements(jsonSchema)
  // The type assertion here is safe because JSONSchema7 is a subset of JSONSchema
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return strictSchema as JSONSchema
}
