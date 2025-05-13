'use server'

import { createClient } from '@/libs/db/server'
import * as v from 'valibot'

// Schema for adding a comment
const addCommentSchema = v.object({
  feedbackId: v.pipe(v.string()),
  content: v.pipe(v.string(), v.minLength(1, 'Comment cannot be empty')),
})

/**
 * Add a comment to a review feedback
 */
export async function addReviewFeedbackComment(data: {
  feedbackId: string
  content: string
}) {
  // Validate input data
  const parsedData = v.safeParse(addCommentSchema, data)
  if (!parsedData.success) {
    throw new Error(`Invalid data: ${JSON.stringify(parsedData.issues)}`)
  }

  // Get the current user
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new Error('You must be logged in to add a comment')
  }

  const { feedbackId, content } = parsedData.output
  const now = new Date().toISOString()

  try {
    // Insert the comment
    const { data: comment, error } = await supabase
      .from('review_feedback_comments')
      .insert({
        review_feedback_id: feedbackId,
        user_id: userData.user.id,
        content,
        updated_at: now,
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`)
    }

    return { success: true, data: comment }
  } catch (error) {
    console.error('Error adding comment:', error)
    throw error
  }
}
