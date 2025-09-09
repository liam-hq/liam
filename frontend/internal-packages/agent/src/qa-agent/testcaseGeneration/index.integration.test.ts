import { END, START, StateGraph } from '@langchain/langgraph'
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
      schemaContext: `
Table: users
- id: uuid (not null)
- email: varchar (not null)

Table: tasks  
- id: uuid (not null)
- user_id: uuid (not null)
- title: varchar (not null)
- status: varchar (not null)
      `,
      testcases: [],
    }

    // Act
    const stream = await graph.stream(state, config)

    // Assert (Output)
    await outputStream(stream)
  })
})
