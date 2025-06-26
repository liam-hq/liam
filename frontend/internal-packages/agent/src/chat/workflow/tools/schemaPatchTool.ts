import { DynamicStructuredTool } from '@langchain/core/tools'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import type { WorkflowState } from '../types'

const schemaPatchInputSchema = v.object({
  patch: v.array(v.any()),
  message: v.optional(v.string()),
})

export const createSchemaPatchTool = (state: WorkflowState) => {
  const jsonSchema = toJsonSchema(
    schemaPatchInputSchema,
  ) as unknown as ConstructorParameters<
    typeof DynamicStructuredTool
  >[0]['schema']

  return new DynamicStructuredTool({
    name: 'schema_patch',
    description: 'Apply JSON Patch operations to update the database schema',
    schema: jsonSchema,
    func: async (input: v.InferOutput<typeof schemaPatchInputSchema>) => {
      const { patch, message } = input

      const result = await state.repositories.schema.createVersion({
        buildingSchemaId: state.buildingSchemaId,
        latestVersionNumber: state.latestVersionNumber,
        patch,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update schema')
      }

      return JSON.stringify({
        success: true,
        message: message || 'Schema updated successfully',
      })
    },
  })
}
