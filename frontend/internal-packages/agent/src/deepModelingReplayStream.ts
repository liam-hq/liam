import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { createGraph } from './createGraph'
import { customEventIterator } from './utils/customEventIterator'
import {
  type SetupStreamOptionsParams,
  setupStreamOptions,
} from './utils/workflowSetup'

export async function deepModelingReplayStream(
  checkpointer: BaseCheckpointSaver,
  params: SetupStreamOptionsParams & {
    checkpoint_id: string
  },
) {
  const compiled = createGraph(checkpointer)

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
