'use server'

import { createClient } from '@/libs/db/server'
import * as v from 'valibot'

const requestSchema = v.object({
  feedbackId: v.pipe(v.number()),
  resolutionComment: v.optional(v.nullable(v.string())),
})

export const resolveReviewFeedback = async (data: {
  feedbackId: number
  resolutionComment?: string | null
}) => {
  const parsedData = v.safeParse(requestSchema, data)

  if (!parsedData.success) {
    throw new Error(`Invalid data: ${JSON.stringify(parsedData.issues)}`)
  }

  const { feedbackId, resolutionComment } = parsedData.output

  try {
    const supabase = await createClient()

    const { data: updatedFeedback, error } = await supabase
      .from('ReviewFeedback')
      .update({
        resolvedAt: new Date().toISOString(),
        resolutionComment: resolutionComment || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', feedbackId)
      .select()

    if (error) {
      throw new Error(`Failed to resolve feedback: ${error.message}`)
    }

    return { success: true, data: updatedFeedback }
  } catch (error) {
    console.error('Error resolving review feedback:', error)
    throw error
  }
}
