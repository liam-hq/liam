import * as v from 'valibot'

const summaryItemSchema = v.object({
  type: v.literal('summary_text'),
  text: v.string(),
  index: v.number(),
})

const reasoningSchema = v.object({
  id: v.string(),
  type: v.literal('reasoning'),
  summary: v.array(summaryItemSchema),
})

const toolCallSchema = v.object({
  id: v.string(),
  name: v.string(),
  type: v.literal('tool_call'),
  args: v.record(v.string(), v.unknown()),
})
export type ToolCall = v.InferOutput<typeof toolCallSchema>

export const toolCallsSchema = v.array(toolCallSchema)
export type ToolCalls = v.InferOutput<typeof toolCallsSchema>

export const additionalKwargsSchema = v.object({
  reasoning: v.optional(reasoningSchema),
})
