import { END, START, StateGraph } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
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

    const mockSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'uuid',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            email: {
              name: 'email',
              type: 'varchar',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
        tasks: {
          name: 'tasks',
          columns: {
            id: {
              name: 'id',
              type: 'uuid',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            user_id: {
              name: 'user_id',
              type: 'uuid',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            title: {
              name: 'title',
              type: 'varchar',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            status: {
              name: 'status',
              type: 'varchar',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
      enums: {},
      extensions: {},
    }

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
      ...config,
    })

    // Assert (Output)
    await outputStreamEvents(streamEvents)
  })
})
