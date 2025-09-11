import * as v from 'valibot'

const toolCallSchema = v.object({
  id: v.string(),
  name: v.string(),
  type: v.literal('tool_call'),
  args: v.record(v.string(), v.unknown()),
})
export type ToolCall = v.InferOutput<typeof toolCallSchema>

export const toolCallsSchema = v.array(toolCallSchema)
export type ToolCalls = v.InferOutput<typeof toolCallsSchema>
