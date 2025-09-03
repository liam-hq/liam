import { type BaseMessage, isBaseMessage } from '@langchain/core/messages'
import type { WorkflowConfigurable } from './types'

export async function getMessages(config: {
  configurable: WorkflowConfigurable
}): Promise<BaseMessage[]> {
  const { thread_id, repositories } = config.configurable
  const { checkpointer } = repositories.schema

  if (!thread_id) {
    return []
  }

  const checkpointConfig = {
    configurable: {
      thread_id,
    },
  }

  const checkpointTuple = await checkpointer.getTuple(checkpointConfig)
  if (!checkpointTuple || !checkpointTuple.checkpoint) {
    return []
  }

  const channelValues = checkpointTuple.checkpoint.channel_values
  if (!channelValues || !channelValues['messages']) {
    return []
  }

  const messagesData = channelValues['messages']
  if (!Array.isArray(messagesData)) {
    return []
  }

  return messagesData.filter(isBaseMessage)
}
