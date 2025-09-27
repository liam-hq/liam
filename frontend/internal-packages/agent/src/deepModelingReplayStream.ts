import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { createGraph } from './createGraph'
import { customEventIterator } from './utils/customEventIterator'
import {
  type ReplayStreamParams,
  setupStreamOptions,
} from './utils/setupStreamOptions'

export async function deepModelingReplayStream(
  checkpointer: BaseCheckpointSaver,
  params: ReplayStreamParams,
) {
  const compiled = createGraph(checkpointer)
  const streamOptions = setupStreamOptions(params)
  const stream = compiled.streamEvents(null, streamOptions)

  return customEventIterator(stream)
}
