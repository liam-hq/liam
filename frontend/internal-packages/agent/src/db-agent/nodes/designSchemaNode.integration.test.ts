import { HumanMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStreamEvents,
} from '../../../test-utils/workflowTestHelpers'
import {
  type DbAgentState,
  dbAgentAnnotation,
} from '../shared/dbAgentAnnotation'
import { designSchemaNode } from './designSchemaNode'

describe('designSchemaNode Integration', () => {
  it('should execute designSchemaNode with real APIs', async () => {
    // Arrange
    const graph = new StateGraph(dbAgentAnnotation)
      .addNode('designSchemaNode', designSchemaNode)
      .addEdge(START, 'designSchemaNode')
      .addEdge('designSchemaNode', END)
      .compile()
    const { config, context } = await getTestConfig()

    const userInput =
      'Create a user management system with users, roles, and permissions tables'

    const state: DbAgentState = {
      messages: [new HumanMessage(userInput)],
      schemaData: {
        tables: {},
        enums: {},
        extensions: {},
      },
      buildingSchemaId: context.buildingSchemaId,
      latestVersionNumber: context.latestVersionNumber,
      organizationId: context.organizationId,
      userId: context.userId,
      designSessionId: context.designSessionId,
      prompt: userInput,
      next: END,
    }

    // Act
    const streamEvents = graph.streamEvents(state, {
      ...config,
      streamMode: 'messages',
      version: 'v2',
    })

    // Assert (Output)
    await outputStreamEvents(streamEvents)
  })
})
