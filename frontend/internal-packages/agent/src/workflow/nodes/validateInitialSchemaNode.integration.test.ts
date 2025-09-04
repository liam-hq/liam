import { HumanMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { describe, it } from 'vitest'
import {
  getTestConfig,
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

  it('should handle schema validation with detailed logging', async () => {
    // Arrange
    const graph = new StateGraph(workflowAnnotation)
      .addNode('validateInitialSchemaNode', validateInitialSchemaNode)
      .addEdge(START, 'validateInitialSchemaNode')
      .addEdge('validateInitialSchemaNode', END)
      .compile()
    const { config, context } = await getTestConfig()

    const userInput = 'Test schema validation workflow with logging'

    const state: WorkflowState = {
      userInput,
      messages: [new HumanMessage(userInput)],
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

    // Assert (Output with detailed logging)
    await outputStream(stream, 'DEBUG')
  })
})
