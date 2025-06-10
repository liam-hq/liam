import type { WorkflowStepProgress } from '../../../lib/chat/workflow/constants/progressMessages'
import type { ChatEntry, ResponseChunk } from '../types/chatTypes'

export interface WorkflowProgressState {
  VALIDATION: WorkflowStepProgress | null
  ANSWER_GENERATION: WorkflowStepProgress | null
  FINAL_RESPONSE: WorkflowStepProgress | null
}

/**
 * Helper function to create a ChatEntry from an existing message and additional properties
 */
export const createChatEntry = (
  baseMessage: ChatEntry,
  additionalProps: Partial<ChatEntry>,
): ChatEntry => {
  return { ...baseMessage, ...additionalProps }
}

/**
 * Type guard for parsed response chunks
 */
export const isResponseChunk = (value: unknown): value is ResponseChunk => {
  if (typeof value !== 'object' || value === null) return false

  // Check if the required properties exist
  if (!('type' in value) || !('content' in value)) return false

  // TypeScript now knows that value has 'type' and 'content' properties
  // We can access them safely using bracket notation
  const typeProperty = value['type']
  const contentProperty = value['content']

  return typeof typeProperty === 'string' && typeof contentProperty === 'string'
}

/**
 * Generate unique message ID
 */
export const generateMessageId = (prefix: string): string => {
  return `${prefix}-${Date.now()}`
}

/**
 * Format chat history for API
 */
export const formatChatHistory = (
  messages: ChatEntry[],
): [string, string][] => {
  return messages
    .filter((msg) => msg.id !== 'welcome')
    .map((msg) => [msg.isUser ? 'Human' : 'AI', msg.content])
}

/**
 * Update workflow progress with new step data
 */
export const updateWorkflowProgress = (
  prev: WorkflowProgressState,
  stepProgress: WorkflowStepProgress,
): WorkflowProgressState => {
  return {
    ...prev,
    [stepProgress.id]: stepProgress,
  }
}

/**
 * Reset workflow progress to initial state
 */
export const resetWorkflowProgress = (): WorkflowProgressState => ({
  VALIDATION: null,
  ANSWER_GENERATION: null,
  FINAL_RESPONSE: null,
})
