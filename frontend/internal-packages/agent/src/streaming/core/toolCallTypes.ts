import * as v from 'valibot'

const toolNames = [
  'runTestTool',
  'processAnalyzedRequirementsTool',
  'saveTestcase',
  'schemaDesignTool',
] as const

const baseToolCallSchema = v.object({
  id: v.string(),
  name: v.picklist(toolNames),
})

const toolCallSchema = v.union([
  v.intersect([
    baseToolCallSchema,
    v.object({
      type: v.literal('tool_call_chunk'),
      args: v.string(),
    }),
  ]),
  v.intersect([
    baseToolCallSchema,
    v.object({
      type: v.literal('tool_call'),
      args: v.record(v.string(), v.unknown()),
    }),
  ]),
])
export type ToolCall = v.InferOutput<typeof toolCallSchema>

export const toolCallsSchema = v.array(toolCallSchema)
export type ToolCalls = v.InferOutput<typeof toolCallsSchema>
