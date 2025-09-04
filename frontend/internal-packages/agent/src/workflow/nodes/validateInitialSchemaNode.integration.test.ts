import { HumanMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  getTestConfigWithInitialSchema,
  outputStream,
} from '../../../test-utils/workflowTestHelpers'
import { workflowAnnotation } from '../../chat/workflow/shared/workflowAnnotation'
import type { WorkflowState } from '../../chat/workflow/types'
import { validateInitialSchemaNode } from './validateInitialSchemaNode'

describe('validateInitialSchemaNode Integration', () => {
  it('should handle fresh environment (no initial schema snapshot)', async () => {
    // Arrange
    const graph = new StateGraph(workflowAnnotation)
      .addNode('validateInitialSchemaNode', validateInitialSchemaNode)
      .addEdge(START, 'validateInitialSchemaNode')
      .addEdge('validateInitialSchemaNode', END)
      .compile()
    const { config, context } = await getTestConfig()

    const userInput =
      'Create a user management system with users, roles, and permissions tables'

    const state: WorkflowState = {
      userInput,
      messages: [new HumanMessage(userInput)],
      schemaData: {
        tables: {
          users: {
            name: 'users',
            columns: {
              id: {
                name: 'id',
                type: 'serial',
                default: null,
                check: null,
                notNull: true,
                comment: null,
              },
              email: {
                name: 'email',
                type: 'varchar',
                default: null,
                check: null,
                notNull: true,
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
      },
      testcases: [],
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
    await outputStream(stream, 'DEBUG') // Use DEBUG level for detailed logs
  })

  it('should validate actual schema and execute full validation flow', async () => {
    // Create a test schema using proper factory functions to ensure correct structure
    const testSchema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'serial',
              notNull: true,
            }),
            email: aColumn({
              name: 'email',
              type: 'varchar(255)',
              notNull: true,
            }),
            created_at: aColumn({
              name: 'created_at',
              type: 'timestamp',
              default: 'now()',
              notNull: true,
            }),
          },
        }),
        roles: aTable({
          name: 'roles',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'serial',
              notNull: true,
            }),
            name: aColumn({
              name: 'name',
              type: 'varchar(100)',
              notNull: true,
            }),
          },
          indexes: {},
        }),
      },
    })

    // Arrange - Set up test with actual initial schema for debugging
    const graph = new StateGraph(workflowAnnotation)
      .addNode('validateInitialSchemaNode', validateInitialSchemaNode)
      .addEdge(START, 'validateInitialSchemaNode')
      .addEdge('validateInitialSchemaNode', END)
      .compile()

    // Use the new helper to set up initial_schema_snapshot with actual data
    const { config, context } = await getTestConfigWithInitialSchema(testSchema)

    const userInput = 'Add a permissions table and link it to roles and users'

    const state: WorkflowState = {
      userInput,
      messages: [new HumanMessage(userInput)],
      schemaData: {
        tables: {},
        enums: {},
        extensions: {},
      },
      testcases: [],
      buildingSchemaId: context.buildingSchemaId,
      latestVersionNumber: context.latestVersionNumber,
      designSessionId: context.designSessionId,
      userId: context.userId,
      organizationId: context.organizationId,
      next: END,
    }

    // Act
    const stream = await graph.stream(state, config)

    // Assert (Output with detailed logging to see full validation flow)
    await outputStream(stream, 'DEBUG')
  })
})
