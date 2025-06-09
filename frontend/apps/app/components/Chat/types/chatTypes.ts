import type { WorkflowStepProgress } from '../../../lib/chat/workflow/constants/progressMessages'
import type { Mode } from '../../ChatInput/components/ModeToggleSwitch/ModeToggleSwitch'
import type { ChatMessageProps } from '../../ChatMessage'

/**
 * Represents a chat message entry with additional metadata
 */
export interface ChatEntry extends ChatMessageProps {
  /** Unique identifier for the message */
  id: string
  /** The type of agent that generated this message (ask or build) */
  agentType?: Mode
  /** Database message ID for persistence */
  dbId?: string
}

/**
 * Type guard for streaming response chunks
 */
export interface ResponseChunk {
  type: 'text' | 'error' | 'progress'
  content: string | WorkflowStepProgress
}
