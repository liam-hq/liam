/**
 * Infers the JSON Schema type from a const value
 *
 * OpenAI Structured Outputs requirement:
 * https://platform.openai.com/docs/guides/structured-outputs/supported-schemas
 * When using "const", a corresponding "type" field is required.
 * Example: {"const": "abc", "type": "string"} is valid
 *          {"const": "abc"} alone is invalid (needs "type")
 */
function inferTypeFromConst(constValue: unknown): string | undefined {
  if (constValue === null) return 'null'
  if (typeof constValue === 'string') return 'string'
  if (typeof constValue === 'number') return 'number'
  if (typeof constValue === 'boolean') return 'boolean'
  if (Array.isArray(constValue)) return 'array'
  if (typeof constValue === 'object') return 'object'
  return undefined
}

/**
 * Processes object schema for OpenAI strict mode compliance
 *
 * OpenAI Structured Outputs requirements:
 * https://platform.openai.com/docs/guides/structured-outputs/supported-schemas
 */
function processObjectSchema(result: Record<string, unknown>): void {
  if (result['type'] !== 'object') return

  // OpenAI requirement 1: All objects must have "additionalProperties": false
  // "By default, additionalProperties is set to false"
  // "all objects must set additionalProperties: false"
  if (!('additionalProperties' in result)) {
    result['additionalProperties'] = false
  }

  // OpenAI requirement 2 (critical fix):
  // Objects with only additionalProperties (generated from v.record())
  // are not recognized by OpenAI's strict mode. Empty "properties": {} is needed.
  // This is an undocumented requirement discovered from actual API errors:
  // Needed to avoid "Extra required key 'columns' supplied" error
  if ('additionalProperties' in result && !('properties' in result)) {
    result['properties'] = {}
  }
}

/**
 * Adds missing type field for const schemas
 *
 * OpenAI Structured Outputs requirement:
 * https://platform.openai.com/docs/guides/structured-outputs/supported-schemas
 * const requires explicit "type" field
 * Note: enum does NOT require type field (verified by testing)
 */
function addMissingTypes(result: Record<string, unknown>): void {
  // Already has type, nothing to do
  if ('type' in result) return

  // OpenAI requirement: "const" requires a corresponding "type"
  // Error example: "schema must have a 'type' key" (for op: v.literal('add'))
  if ('const' in result) {
    const inferredType = inferTypeFromConst(result['const'])
    if (inferredType) {
      result['type'] = inferredType
    }
  }
  // Note: enum does NOT need type inference - it works without type field
}

/**
 * Applies all OpenAI Structured Outputs requirements to the schema
 *
 * Main entry point for OpenAI Structured Outputs strict mode transformation
 * https://platform.openai.com/docs/guides/structured-outputs/supported-schemas
 *
 * Applies the following requirements:
 * 1. Add additionalProperties: false to all objects
 * 2. Add empty properties: {} to objects with only additionalProperties
 * 3. Add type field for const values (enum doesn't need it)
 */
export function applyOpenAISchemaRequirements(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  // Handle arrays recursively
  if (Array.isArray(schema)) {
    return schema.map(applyOpenAISchemaRequirements)
  }

  // Create a new object to avoid mutating the original
  const result: Record<string, unknown> = {}

  // Recursively process nested schemas
  for (const [key, value] of Object.entries(schema)) {
    result[key] = applyOpenAISchemaRequirements(value)
  }

  // Apply OpenAI strict mode transformations
  processObjectSchema(result)
  addMissingTypes(result)

  return result
}
