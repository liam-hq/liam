import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  ToolMessage,
} from '@langchain/core/messages'
import type { Database } from '@liam-hq/db'
import type { SchemaRepository } from '../../../repositories/types'
import { isMessageContentError } from './toolMessageUtils'

type TimelineSyncContext = {
  designSessionId: string
  organizationId: string
  userId: string
  repositories: { schema: SchemaRepository }
  assistantRole?: Database['public']['Enums']['assistant_role_enum']
}

async function handleAIMessage(
  message: AIMessage,
  context: TimelineSyncContext,
): Promise<void> {
  const result = await context.repositories.schema.createTimelineItem({
    designSessionId: context.designSessionId,
    content: message.text,
    type: 'assistant',
    role: context.assistantRole || 'db',
  })

  if (!result.success) {
    console.error('Failed to create timeline item for AIMessage:', result.error)
  }
}

async function handleHumanMessage(
  message: HumanMessage,
  context: TimelineSyncContext,
): Promise<void> {
  const result = await context.repositories.schema.createTimelineItem({
    designSessionId: context.designSessionId,
    content: message.text,
    type: 'user',
    userId: context.userId,
  })

  if (!result.success) {
    console.error(
      'Failed to create timeline item for HumanMessage:',
      result.error,
    )
  }
}

async function handleToolMessage(
  message: ToolMessage,
  context: TimelineSyncContext,
): Promise<void> {
  const content = message.text

  const isError = isMessageContentError(content)
  const timelineType = isError ? 'error' : 'assistant'

  const result = isError
    ? await context.repositories.schema.createTimelineItem({
        designSessionId: context.designSessionId,
        content,
        type: 'error',
      })
    : await context.repositories.schema.createTimelineItem({
        designSessionId: context.designSessionId,
        content,
        type: 'assistant',
        role: context.assistantRole || 'db',
      })

  if (!result.success) {
    console.error(
      `Failed to create timeline item for ToolMessage (${timelineType}):`,
      result.error,
    )
  }
}

export async function withTimelineItemSync(
  message: BaseMessage,
  context: TimelineSyncContext,
): Promise<BaseMessage> {
  if (message instanceof AIMessage) {
    await handleAIMessage(message, context)
  } else if (message instanceof HumanMessage) {
    await handleHumanMessage(message, context)
  } else if (message instanceof ToolMessage) {
    await handleToolMessage(message, context)
  }

  return message
}
