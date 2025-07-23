import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
} from '@langchain/core/messages'
import type { Database } from '@liam-hq/db'
import type { SchemaRepository } from '../../../repositories/types'

type TimelineSyncContext = {
  designSessionId: string
  organizationId: string
  userId: string
  repositories: { schema: SchemaRepository }
  assistantRole?: Database['public']['Enums']['assistant_role_enum']
}

export async function withTimelineItemSync(
  message: BaseMessage,
  context: TimelineSyncContext,
): Promise<BaseMessage> {
  if (message instanceof AIMessage) {
    const result = await context.repositories.schema.createTimelineItem({
      designSessionId: context.designSessionId,
      content:
        typeof message.content === 'string'
          ? message.content
          : JSON.stringify(message.content),
      type: 'assistant',
      role: context.assistantRole || 'db',
    })

    if (!result.success) {
      console.error(
        'Failed to create timeline item for AIMessage:',
        result.error,
      )
    }
  } else if (message instanceof HumanMessage) {
    const result = await context.repositories.schema.createTimelineItem({
      designSessionId: context.designSessionId,
      content:
        typeof message.content === 'string'
          ? message.content
          : JSON.stringify(message.content),
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

  return message
}
