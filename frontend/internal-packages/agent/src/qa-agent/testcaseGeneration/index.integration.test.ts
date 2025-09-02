import { END, START, StateGraph } from '@langchain/langgraph'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStream,
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

    const state: TestcaseState = {
      messages: [],
      currentRequirement: {
        type: 'functional',
        category: 'tasks',
        requirement: 'Users can create tasks with title and status',
        businessContext:
          'A task management system where users create projects and tasks',
      },
      schemaData: aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
              email: aColumn({
                name: 'email',
                type: 'varchar',
                notNull: true,
              }),
            },
          }),
          tasks: aTable({
            name: 'tasks',
            columns: {
              id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
              user_id: aColumn({
                name: 'user_id',
                type: 'uuid',
                notNull: true,
              }),
              title: aColumn({ name: 'title', type: 'varchar', notNull: true }),
              status: aColumn({
                name: 'status',
                type: 'varchar',
                notNull: true,
              }),
            },
          }),
        },
      }),
      testcases: [],
    }

    // Act
    const stream = await graph.stream(state, config)

    // Assert (Output)
    await outputStream(stream)
  })
})
