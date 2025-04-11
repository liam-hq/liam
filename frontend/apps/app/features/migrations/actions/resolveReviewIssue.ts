'use server'

import { createClient } from '@/libs/db/server'
import * as v from 'valibot'

const requestSchema = v.object({
  issueId: v.pipe(v.number()),
  resolutionComment: v.optional(v.nullable(v.string())),
})

export const resolveReviewIssue = async (data: {
  issueId: number
  resolutionComment?: string | null
}) => {
  const parsedData = v.safeParse(requestSchema, data)

  if (!parsedData.success) {
    throw new Error(`Invalid data: ${JSON.stringify(parsedData.issues)}`)
  }

  const { issueId, resolutionComment } = parsedData.output

  try {
    const supabase = await createClient()

    const { data: updatedIssue, error } = await supabase
      .from('ReviewIssue')
      .update({
        resolvedAt: new Date().toISOString(),
        resolutionComment: resolutionComment || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', issueId)
      .select()

    if (error) {
      throw new Error(`Failed to resolve issue: ${error.message}`)
    }

    return { success: true, data: updatedIssue }
  } catch (error) {
    console.error('Error resolving review issue:', error)
    throw error
  }
}
