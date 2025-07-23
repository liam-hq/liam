import type { RunnableConfig } from '@langchain/core/runnables'
import { tool } from '@langchain/core/tools'
import type { JSONSchema } from '@langchain/core/utils/json_schema'
import { operationsSchema } from '@liam-hq/db-structure'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import { getToolConfigurable } from '../getToolConfigurable'

const schemaDesignToolSchema = v.object({
  operations: operationsSchema,
})

// toJsonSchema returns a JSONSchema7, which is not assignable to JSONSchema
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const toolSchema = toJsonSchema(schemaDesignToolSchema) as JSONSchema

export const schemaDesignTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<string> => {
    const toolConfigurableResult = getToolConfigurable(config)
    if (toolConfigurableResult.isErr()) {
      return `Configuration error: ${toolConfigurableResult.error.message}. Please check the tool configuration and try again.`
    }
    const { repositories, buildingSchemaVersionId } =
      toolConfigurableResult.value
    const parsed = v.safeParse(schemaDesignToolSchema, input)
    if (!parsed.success) {
      const errorDetails = parsed.issues
        .map((issue) => `${issue.path?.join('.')}: ${issue.message}`)
        .join(', ')
      return `Input validation failed: ${errorDetails}. Please check your operations format and ensure all required fields are provided correctly.`
    }

    const result = await repositories.schema.updateVersion({
      buildingSchemaVersionId,
      patch: parsed.output.operations,
    })

    if (!result.success) {
      const errorMessage = result.error ?? 'Unknown error occurred'

      // LangGraph tool nodes require throwing errors to trigger retry mechanism
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(
        `Schema update failed: ${errorMessage}. Please fix the error and try again.`,
      )
    }

    return 'Schema successfully updated. The operations have been applied to the database schema.'
  },
  {
    name: 'schemaDesignTool',
    description:
      'Use to design database schemas, recommend table structures, and help with database modeling. This tool applies JSON Patch operations to modify schema elements including tables, columns, indexes, and constraints. When operations fail, the tool provides detailed error messages with specific guidance for correction. Always include all required schema properties (columns, constraints, indexes) when creating tables.',
    schema: toolSchema,
  },
)
