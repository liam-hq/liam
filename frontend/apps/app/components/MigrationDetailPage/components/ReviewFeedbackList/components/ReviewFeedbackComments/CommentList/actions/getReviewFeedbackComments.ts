'use server'

import { createClient } from '@/libs/db/server'
import type { Tables } from '@liam-hq/db'
import * as v from 'valibot'

// Schema for fetching comments
const getCommentsSchema = v.object({
  feedbackId: v.pipe(v.string()),
})

// Type for a comment with user information
export type CommentWithUser = Tables<'review_feedback_comments'> & {
  user: Tables<'users'>
}

/**
 * Get comments for a review feedback with user information
 */
export async function getReviewFeedbackComments(data: {
  feedbackId: string
}): Promise<CommentWithUser[]> {
  // Validate input data
  const parsedData = v.safeParse(getCommentsSchema, data)
  if (!parsedData.success) {
    throw new Error(`Invalid data: ${JSON.stringify(parsedData.issues)}`)
  }

  const { feedbackId } = parsedData.output

  try {
    const supabase = await createClient()

    // Get comments with user information
    const { data: comments, error } = await supabase
      .from('review_feedback_comments')
      .select<string, CommentWithUser>(`
          *,
          users (
            name
          )
        `)
      .eq('review_feedback_id', feedbackId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to get comments: ${error.message}`)
    }

    return comments
  } catch (error) {
    console.error('Error getting comments:', error)
    throw error
  }
}
