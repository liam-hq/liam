import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { customEventIterator } from '../utils/customEventIterator'
import {
  type SetupStreamOptionsParams,
  setupStreamOptions,
} from '../utils/workflowSetup'
import { createDbAgentGraph } from './createDbAgentGraph'

export async function dbAgentReplayStream(
  checkpointer: BaseCheckpointSaver,
  params: SetupStreamOptionsParams & {
    checkpoint_id: string
  },
) {
  const compiled = createDbAgentGraph(checkpointer)

  const baseStreamOptions = setupStreamOptions(params)
  const streamOptions = {
    ...baseStreamOptions,
    configurable: {
      ...baseStreamOptions.configurable,
      checkpoint_id: params.checkpoint_id,
    },
  }

  const stream = compiled.streamEvents(null, streamOptions)

  return customEventIterator(stream)
}
