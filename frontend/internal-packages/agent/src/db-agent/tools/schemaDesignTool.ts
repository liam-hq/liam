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
      return toolConfigurableResult.error.message
    }
    const { repositories, buildingSchemaVersionId } =
      toolConfigurableResult.value
    const parsed = v.parse(schemaDesignToolSchema, input)

    const result = await repositories.schema.updateVersion({
      buildingSchemaVersionId,
      patch: parsed.operations,
    })

    if (!result.success) {
      return result.error ?? 'Unknown error'
    }

    return 'success'
  },
  {
    name: 'schemaDesignTool',
    description:
      'Use to design database schemas, recommend table structures, and help with database modeling.',
    schema: toolSchema,
  },
)
