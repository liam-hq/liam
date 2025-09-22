import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'

/**
 * Type guard to check if data has message property
 */
function hasMessage(data: unknown): data is { message: string } {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  if (!('message' in data)) {
    return false
  }

  // TypeScript knows data has 'message' property after the check above
  return typeof data.message === 'string'
}

/**
 * Extract error information from LangGraph checkpoints for a design session
 *
 * This function examines checkpoint history to find errors that occurred during
 * workflow execution, particularly from validateInitialSchemaNode and other error-prone nodes.
 */
export async function getCheckpointErrors(
  checkpointer: BaseCheckpointSaver,
  threadId: string,
): Promise<string[]> {
  const checkpointConfig = {
    configurable: {
      thread_id: threadId,
    },
  }

  const checkpointTuple = await checkpointer.getTuple(checkpointConfig)
  if (!checkpointTuple || !checkpointTuple.checkpoint) {
    return []
  }

  const errorMessages: string[] = []

  // Check pendingWrites for __error__ channel
  if (checkpointTuple.pendingWrites) {
    for (const [, channel, value] of checkpointTuple.pendingWrites) {
      if (channel === '__error__' && hasMessage(value)) {
        errorMessages.push(value.message)
      }
    }
  }

  return errorMessages
}
