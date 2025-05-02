import type { Operation, SchemaOverride } from '@liam-hq/db-structure'
import { operationSchema } from '@liam-hq/db-structure'
import { safeParse } from 'valibot'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

/**
 * Result of processing schema operations
 */
export interface SchemaOperationResult {
  operations: Operation[]
  modified: boolean
  error?: string
}

/**
 * Process AI response to extract schema operations from YAML
 * @param message - AI response message containing potential schema operations in YAML format
 * @returns Object containing extracted operations, modification status, and any errors
 */
export function processSchemaOperations(
  message: string,
): SchemaOperationResult {
  try {
    console.log('[SchemaModifier] Processing YAML operations from message:', message)
    
    // Extract operations from YAML code blocks in the message
    const operations: Operation[] = []
    
    // Try to match YAML code blocks with different patterns
    const yamlCodeBlocks = message.match(/```(?:yaml|yml)?\s*([\s\S]*?)\s*```/g)
    
    // Debug logging
    console.log('[SchemaModifier] Found YAML code blocks:', yamlCodeBlocks)
    
    // Try to directly parse the entire message as YAML if no code blocks found
    if (!yamlCodeBlocks || yamlCodeBlocks.length === 0) {
      console.log('[SchemaModifier] No code blocks found, trying to parse entire message as YAML')
      try {
        const directYaml = parseYaml(message)
        if (directYaml) {
          const result = safeParse(operationSchema, directYaml)
          if (result.success) {
            console.log('[SchemaModifier] Successfully parsed entire message as a YAML operation')
            operations.push(result.output)
            return {
              operations,
              modified: true,
            }
          } else {
            console.log('[SchemaModifier] Direct parsing failed validation:', result.issues)
          }
        }
      } catch (e) {
        console.log('[SchemaModifier] Direct parsing as YAML failed:', e)
      }
      
      return {
        operations: [],
        modified: false,
        error: 'No YAML code blocks found in response',
      }
    }

    for (const block of yamlCodeBlocks) {
      try {
        // Extract the YAML content from the code block
        const yamlMatch = block.match(/```(?:yaml|yml)?\s*([\s\S]*?)\s*```/)
        if (!yamlMatch || !yamlMatch[1]) {
          console.warn('[SchemaModifier] Could not extract YAML content from code block:', block)
          continue
        }

        const yamlContent = yamlMatch[1].trim()
        if (!yamlContent) {
          console.log('[SchemaModifier] Empty YAML content in block')
          continue
        }
        
        console.log('[SchemaModifier] Processing YAML content:', yamlContent)

        // Parse the YAML content
        const parsedOperation = parseYaml(yamlContent)
        console.log('[SchemaModifier] Parsed YAML to object:', parsedOperation)

        // Validate that the parsed content is an operation
        const result = safeParse(operationSchema, parsedOperation)

        if (result.success) {
          console.log('[SchemaModifier] Valid operation found:', result.output)
          operations.push(result.output)
        } else {
          console.error('[SchemaModifier] Invalid operation in YAML block:', result.issues)
          // Continue processing other blocks even if this one failed
        }
      } catch (error) {
        console.error('[SchemaModifier] Error processing YAML block:', error)
        // Continue processing other blocks even if this one failed
      }
    }

    // If we found at least one valid operation, consider the modification successful
    if (operations.length > 0) {
      return {
        operations,
        modified: true,
      }
    }
    return {
      operations: [],
      modified: false,
      error: 'No valid operations found in YAML code blocks',
    }
  } catch (e) {
    // Handle any unexpected errors
    console.error('Failed to process schema operations:', e)
    return {
      operations: [],
      modified: false,
      error: `Processing error: ${e instanceof Error ? e.message : JSON.stringify(e)}`,
    }
  }
}

/**
 * Creates or updates a schema override with new operations
 * @param currentOverride - Current schema override or null if none exists
 * @param newOperations - New operations to add to the override
 * @returns Updated schema override with the new operations
 */
export function createOrUpdateSchemaOverride(
  currentOverride: SchemaOverride | null,
  newOperations: Operation[],
): SchemaOverride {
  // If no current override exists, create a new one
  if (!currentOverride) {
    return {
      overrides: {
        tables: {},
        tableGroups: {},
        operations: newOperations,
      },
    }
  }

  // Start with a deep copy of the current override
  const updatedOverride: SchemaOverride = JSON.parse(
    JSON.stringify(currentOverride),
  )

  // Initialize operations array if it doesn't exist
  if (!updatedOverride.overrides.operations) {
    updatedOverride.overrides.operations = []
  }

  // Add new operations
  updatedOverride.overrides.operations.push(...newOperations)

  return updatedOverride
}

/**
 * Convert a schema override to YAML format
 * @param override - Schema override to convert to YAML
 * @returns YAML string representation of the schema override
 */
export function schemaOverrideToYaml(override: SchemaOverride): string {
  try {
    // Use the yaml library to convert the schema override to YAML
    return stringifyYaml(override)
  } catch (error) {
    console.error('Error converting schema override to YAML:', error)
    throw new Error(
      `Failed to convert schema override to YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
