import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { customEventIterator } from '../utils/customEventIterator'
import {
  type ReplayStreamParams,
  setupStreamOptions,
} from '../utils/setupStreamOptions'
import { createDbAgentGraph } from './createDbAgentGraph'

export async function dbAgentReplayStream(
  checkpointer: BaseCheckpointSaver,
  params: ReplayStreamParams,
) {
  const compiled = createDbAgentGraph(checkpointer)
  const options = setupStreamOptions({
    ...params,
    subgraphs: true,
  })
  const stream = compiled.streamEvents(null, options)

  return customEventIterator(stream)
}
