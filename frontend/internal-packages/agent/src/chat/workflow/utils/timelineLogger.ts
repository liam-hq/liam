import { ResultAsync } from 'neverthrow'
import type { WorkflowState } from '../types'

/**
 * Helper function to create assistant_log timeline items
 * Reduces code duplication across workflow nodes
 */
export async function logAssistantMessage(
  state: WorkflowState,
  content: string,
): Promise<void> {
  const result = await ResultAsync.fromPromise(
    state.repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content,
      type: 'assistant_log',
    }),
    (error) => error,
  )

  result.mapErr((error) => {
    // Log error but don't throw to avoid breaking workflow
    console.error('Failed to create timeline item:', error)
  })
}
