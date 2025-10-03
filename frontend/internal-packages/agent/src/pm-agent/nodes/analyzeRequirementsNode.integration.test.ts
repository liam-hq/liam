import { HumanMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStreamEvents,
} from '../../../test-utils/workflowTestHelpers'
import {
  type PmAgentState,
  pmAgentStateAnnotation,
} from '../pmAgentAnnotations'
import { analyzeRequirementsNode } from './analyzeRequirementsNode'

describe('analyzeRequirementsNode Integration', () => {
  it('should execute analyzeRequirementsNode with real APIs', async () => {
    // Arrange
    const { config, context, checkpointer } = await getTestConfig()
    const graph = new StateGraph(pmAgentStateAnnotation)
      .addNode('analyzeRequirementsNode', analyzeRequirementsNode)
      .addEdge(START, 'analyzeRequirementsNode')
      .addEdge('analyzeRequirementsNode', END)
      .compile({ checkpointer })

    const userInput =
      'Create a task management system where users can create projects, assign tasks, and track progress'

    const state: PmAgentState = {
      messages: [new HumanMessage(userInput)],
      analyzedRequirements: {
        goal: '',
        testcases: {},
      },
      designSessionId: context.designSessionId,
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'uuid',
                notNull: true,
              }),
              email: aColumn({
                name: 'email',
                type: 'varchar',
                notNull: true,
              }),
            },
          }),
        },
      }),
      analyzedRequirementsRetryCount: 0,
      artifactSaveSuccessful: false,
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
