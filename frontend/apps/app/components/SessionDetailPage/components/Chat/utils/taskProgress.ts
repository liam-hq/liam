/**
 * Task progress status indicators
 */
export const TASK_STATUS = {
  PENDING: '•',
  IN_PROGRESS: '⏳',
  COMPLETED: '✓',
  FAILED: '✗',
} as const

export type TaskStatus = keyof typeof TASK_STATUS

/**
 * Replace task status indicators in message content
 * @internal Used by markTasksAsCompleted and markTasksAsFailed
 */
const updateTaskStatus = (
  content: string,
  fromStatus: string,
  toStatus: string,
): string => {
  // Simple replacement of status indicators
  return content.replace(new RegExp(fromStatus, 'g'), toStatus)
}

/**
 * Update in-progress tasks to completed
 */
export const markTasksAsCompleted = (content: string): string => {
  return updateTaskStatus(
    content,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.COMPLETED,
  )
}

/**
 * Update in-progress tasks to failed
 */
export const markTasksAsFailed = (content: string): string => {
  return updateTaskStatus(content, TASK_STATUS.IN_PROGRESS, TASK_STATUS.FAILED)
}

/**
 * Extract tasks from message content
 */
export const extractTasks = (content: string): string[] => {
  const lines = content.split('\n')
  return lines.filter((line) => {
    const trimmed = line.trim()
    return (
      trimmed.startsWith(TASK_STATUS.PENDING) ||
      trimmed.startsWith(TASK_STATUS.IN_PROGRESS) ||
      trimmed.startsWith(TASK_STATUS.COMPLETED) ||
      trimmed.startsWith(TASK_STATUS.FAILED)
    )
  })
}

/**
 * Check if content has in-progress tasks
 */
export const hasInProgressTasks = (content: string): boolean => {
  return content.includes(TASK_STATUS.IN_PROGRESS)
}

/**
 * Parse task line to extract status and text
 */
export const parseTaskLine = (
  line: string,
): { status: string; text: string } | null => {
  const trimmed = line.trim()
  for (const status of Object.values(TASK_STATUS)) {
    if (trimmed.startsWith(status)) {
      return {
        status,
        text: trimmed.substring(status.length).trim(),
      }
    }
  }
  return null
}

/**
 * Get task status from string
 */
export const getTaskStatusKey = (
  statusIndicator: string,
): TaskStatus | null => {
  // Manual checks without type assertions
  if (statusIndicator === TASK_STATUS.PENDING) return 'PENDING'
  if (statusIndicator === TASK_STATUS.IN_PROGRESS) return 'IN_PROGRESS'
  if (statusIndicator === TASK_STATUS.COMPLETED) return 'COMPLETED'
  if (statusIndicator === TASK_STATUS.FAILED) return 'FAILED'
  return null
}
