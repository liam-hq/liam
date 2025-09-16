import { END, START, StateGraph } from '@langchain/langgraph'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStreamEvents,
} from '../../../test-utils/workflowTestHelpers'
import { testcaseGeneration } from './index'
import { testcaseAnnotation } from './testcaseAnnotation'

describe('testcaseGeneration Integration', () => {
  it('executes testcaseGeneration subgraph with real APIs', async () => {
    // Arrange
    const graph = new StateGraph(testcaseAnnotation)
      .addNode('testcaseGeneration', testcaseGeneration)
      .addEdge(START, 'testcaseGeneration')
      .addEdge('testcaseGeneration', END)
      .compile()

    const { config } = await getTestConfig()

    type TestcaseState = typeof testcaseAnnotation.State

    const mockSchema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            email: aColumn({ name: 'email', type: 'varchar', notNull: true }),
          },
        }),
        tasks: aTable({
          name: 'tasks',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            user_id: aColumn({ name: 'user_id', type: 'uuid', notNull: true }),
            title: aColumn({ name: 'title', type: 'varchar', notNull: true }),
            status: aColumn({ name: 'status', type: 'varchar', notNull: true }),
          },
        }),
      },
    })

    const state: TestcaseState = {
      messages: [],
      currentRequirement: {
        type: 'functional',
        category: 'tasks',
        requirement: 'Users can create tasks with title and status',
        businessContext:
          'A task management system where users create projects and tasks',
        requirementId: '550e8400-e29b-41d4-a716-446655440000',
      },
      schemaData: mockSchema,
      testcases: [],
      schemaIssues: [],
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
