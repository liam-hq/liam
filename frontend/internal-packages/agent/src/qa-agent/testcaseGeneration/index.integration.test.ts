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
    const { config, checkpointer } = await getTestConfig()
    const graph = new StateGraph(testcaseAnnotation)
      .addNode('testcaseGeneration', testcaseGeneration)
      .addEdge(START, 'testcaseGeneration')
      .addEdge('testcaseGeneration', END)
      .compile({ checkpointer })

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
      internalMessages: [],
      currentTestcase: {
        category: 'tasks',
        testcase: {
          id: '123',
          title: 'Users can create tasks with title and status',
          type: 'INSERT',
          sql: '',
          testResults: [],
        },
      },
      goal: 'A task management system where users create projects and tasks',
      schemaData: mockSchema,
      schemaIssues: [],
      generatedSqls: [],
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
