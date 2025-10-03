import { HumanMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { aSchema } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStreamEvents,
} from '../test-utils/workflowTestHelpers'
import { createGraph } from './createGraph'
import type { WorkflowState } from './types'

describe('createGraph Integration', () => {
  it('should execute complete workflow', async () => {
    // Arrange
    const graph = createGraph()
    const { config, context } = await getTestConfig()

    const userInput = 'Design a simple user management system'

    const initialState: WorkflowState = {
      messages: [new HumanMessage(userInput)],
      analyzedRequirements: {
        goal: '',
        testcases: {},
      },
      schemaData: aSchema({ tables: {} }),
      schemaIssues: [],
      designSessionId: context.designSessionId,
      buildingSchemaId: context.buildingSchemaId,
      organizationId: context.organizationId,
      userId: context.userId,
      next: END,
    }

    // Act
    const streamEvents = graph.streamEvents(initialState, {
      ...config,
      streamMode: 'messages',
      version: 'v2',
    })

    // Assert
    await outputStreamEvents(streamEvents)
  })
})
