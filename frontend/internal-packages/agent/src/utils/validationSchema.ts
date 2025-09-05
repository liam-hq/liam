import * as v from 'valibot'

export const reasoningSchema = v.object({
  type: v.literal('reasoning'),
  summary: v.array(
    v.object({
      type: v.literal('summary_text'),
      text: v.string(),
    }),
  ),
})
