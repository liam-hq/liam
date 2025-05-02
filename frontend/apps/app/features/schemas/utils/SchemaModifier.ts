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
    // Extract operations from YAML code blocks in the message
    const operations: Operation[] = []

    // Try multiple patterns for YAML code blocks
    // 1. Standard markdown code blocks with yaml/yml language
    // 2. Code blocks with no language specified
    const yamlCodeBlockPatterns = [
      /```(?:yaml|yml)\s*([\s\S]*?)\s*```/g, // With explicit yaml/yml language tag
      /```\s*([\s\S]*?)\s*```/g, // Any code block (no language specified)
    ]

    let foundCodeBlocks = false

    // Try each pattern to find code blocks
    for (const pattern of yamlCodeBlockPatterns) {
      const matches = Array.from(message.matchAll(pattern))

      if (matches.length > 0) {
        foundCodeBlocks = true

        for (const match of matches) {
          const content = match[1]?.trim()
          if (!content) continue

          try {
            // Try to parse the content as YAML
            const parsedYaml = parseYaml(content)
            if (parsedYaml) {
              // Check if it's an array of operations or a single operation
              if (Array.isArray(parsedYaml)) {
                for (const item of parsedYaml) {
                  const result = safeParse(operationSchema, item)
                  if (result.success) {
                    operations.push(result.output)
                  } else {
                    console.warn(
                      '[SchemaModifier] Array item failed validation:',
                      result.issues,
                    )
                  }
                }
              } else {
                // Handle as single operation
                const result = safeParse(operationSchema, parsedYaml)
                if (result.success) {
                  operations.push(result.output)
                } else {
                  console.warn(
                    '[SchemaModifier] Code block content failed validation:',
                    result.issues,
                  )
                }
              }
            }
          } catch (e) {
            console.warn(
              '[SchemaModifier] Failed to parse code block as YAML:',
              e,
            )
          }
        }
      }
    }

    // If no code blocks were found or none contained valid YAML, try parsing the entire message
    if (!foundCodeBlocks || operations.length === 0) {
      try {
        // Clean the input first - try to remove markdown formatting
        const cleanedMessage = message
          .replace(/^#+\s+.*$/gm, '') // Remove markdown headers
          .replace(/\*\*/g, '') // Remove bold formatting
          .replace(/\*([^*]+)\*/g, '$1') // Remove italic formatting
          .trim()

        const directYaml = parseYaml(cleanedMessage)
        if (directYaml) {
          // Check if it's an array of operations or a single operation
          if (Array.isArray(directYaml)) {
            for (const item of directYaml) {
              const result = safeParse(operationSchema, item)
              if (result.success) {
                operations.push(result.output)
                foundCodeBlocks = true
              }
            }
          } else {
            // Handle as single operation
            const result = safeParse(operationSchema, directYaml)
            if (result.success) {
              operations.push(result.output)
              foundCodeBlocks = true
            } else {
            }
          }
        }
      } catch (_e) {}

      if (!foundCodeBlocks) {
        return {
          operations: [],
          modified: false,
          error: 'No YAML code blocks or valid YAML content found in response',
        }
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
