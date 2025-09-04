import { AIMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { aColumn, aTable } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStream,
} from '../../../test-utils/workflowTestHelpers'
import type { DbAgentState } from '../shared/dbAgentAnnotation'
import { dbAgentAnnotation } from '../shared/dbAgentAnnotation'
import { invokeSchemaDesignToolNode } from './invokeSchemaDesignToolNode'

describe('invokeSchemaDesignToolNode Integration', () => {
  it('should execute schema design tool with real APIs', async () => {
    // Arrange
    const graph = new StateGraph(dbAgentAnnotation)
      .addNode('invokeSchemaDesignTool', invokeSchemaDesignToolNode)
      .addEdge(START, 'invokeSchemaDesignTool')
      .addEdge('invokeSchemaDesignTool', END)
      .compile()
    const { config, context } = await getTestConfig()

    const toolCallMessage = new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'test-tool-call-id',
          name: 'schemaDesignTool',
          args: {
            operations: [
              {
                op: 'add',
                path: '/tables/users',
                value: aTable({
                  name: 'users',
                  columns: {
                    id: aColumn({
                      name: 'id',
                      type: 'uuid',
                      notNull: true,
                      default: 'gen_random_uuid()',
                    }),
                    email: aColumn({
                      name: 'email',
                      type: 'varchar(255)',
                      notNull: true,
                    }),
                    created_at: aColumn({
                      name: 'created_at',
                      type: 'timestamp',
                      notNull: true,
                      default: 'now()',
                    }),
                  },
                  constraints: {
                    users_pkey: {
                      type: 'PRIMARY KEY' as const,
                      name: 'users_pkey',
                      columnNames: ['id'],
                    },
                  },
                }),
              },
            ],
          },
        },
      ],
    })

    const state: DbAgentState = {
      messages: [toolCallMessage],
      schemaData: {
        tables: {},
        enums: {},
        extensions: {},
      },
      buildingSchemaId: context.buildingSchemaId,
      latestVersionNumber: context.latestVersionNumber,
      designSessionId: context.designSessionId,
      userId: context.userId,
      organizationId: context.organizationId,
      next: END,
    }

    // Act
    const stream = await graph.stream(state, config)

    // Assert (Output)
    await outputStream(stream)
  })

  it('should handle tool execution errors gracefully', async () => {
    // Arrange
    const graph = new StateGraph(dbAgentAnnotation)
      .addNode('invokeSchemaDesignTool', invokeSchemaDesignToolNode)
      .addEdge(START, 'invokeSchemaDesignTool')
      .addEdge('invokeSchemaDesignTool', END)
      .compile()
    const { config, context } = await getTestConfig()

    const invalidToolCallMessage = new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'test-invalid-tool-call-id',
          name: 'schemaDesignTool',
          args: {
            operations: [
              {
                op: 'add',
                path: '/tables/invalid_table',
                value: aTable({
                  name: 'invalid_table',
                  columns: {
                    bad_column: aColumn({
                      name: 'bad_column',
                      type: 'invalid_type_that_does_not_exist',
                      notNull: true,
                    }),
                  },
                }),
              },
            ],
          },
        },
      ],
    })

    const state: DbAgentState = {
      messages: [invalidToolCallMessage],
      schemaData: {
        tables: {},
        enums: {},
        extensions: {},
      },
      buildingSchemaId: context.buildingSchemaId,
      latestVersionNumber: context.latestVersionNumber,
      designSessionId: context.designSessionId,
      userId: context.userId,
      organizationId: context.organizationId,
      next: END,
    }

    // Act
    const stream = await graph.stream(state, config)

    // Assert (Output)
    await outputStream(stream)
  })
})
