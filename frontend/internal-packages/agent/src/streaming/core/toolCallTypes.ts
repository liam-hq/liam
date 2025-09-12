import * as v from 'valibot'

const toolCallSchema = v.object({
  id: v.string(),
  name: v.picklist([
    'runTestTool',
    'saveRequirementsToArtifactTool',
    'saveTestcase',
    'schemaDesignTool',
  ] as const),
  type: v.literal('tool_call'),
  args: v.record(v.string(), v.unknown()),
})
export type ToolCall = v.InferOutput<typeof toolCallSchema>

export const toolCallsSchema = v.array(toolCallSchema)
export type ToolCalls = v.InferOutput<typeof toolCallsSchema>
