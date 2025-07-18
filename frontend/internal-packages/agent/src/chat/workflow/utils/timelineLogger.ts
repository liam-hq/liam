import type { Database } from '@liam-hq/db'
import { ResultAsync } from 'neverthrow'
import type { Repositories } from '../../../repositories'
import type { WorkflowState } from '../types'

/**
 * Helper function to create assistant_log timeline items
 * Reduces code duplication across workflow nodes
 */
export async function logAssistantMessage(
  state: WorkflowState,
  repositories: Repositories,
  content: string,
  role: Database['public']['Enums']['assistant_role_enum'],
): Promise<void> {
  const result = await ResultAsync.fromPromise(
    repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content,
      type: 'assistant_log',
      role,
    }),
    (error) => error,
  )

  result.mapErr((error) => {
    // Log error but don't throw to avoid breaking workflow
    console.error('Failed to create timeline item:', error)
  })
}
