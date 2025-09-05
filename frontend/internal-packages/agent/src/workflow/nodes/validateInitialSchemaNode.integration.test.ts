import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStream,
} from '../../../test-utils/workflowTestHelpers'
import { workflowAnnotation } from '../../chat/workflow/shared/workflowAnnotation'
import type { WorkflowState } from '../../chat/workflow/types'

import { validateInitialSchemaNode } from './validateInitialSchemaNode'

describe('validateInitialSchemaNode Integration', () => {
  describe('First execution scenarios', () => {
    it('should display fresh database message when schema is empty', async () => {
      // Arrange
      const graph = new StateGraph(workflowAnnotation)
        .addNode('validateInitialSchema', validateInitialSchemaNode)
        .addEdge(START, 'validateInitialSchema')
        .addEdge('validateInitialSchema', END)
        .compile()

      const { config, context } = await getTestConfig()

      const state: WorkflowState = {
        messages: [new HumanMessage('Create a new database schema')],
        designSessionId: context.designSessionId,
        organizationId: context.organizationId,
        userId: context.userId,
        userInput: 'Create a new database schema',
        schemaData: aSchema({
          tables: {},
          enums: {},
          extensions: {},
        }),
        analyzedRequirements: undefined,
        testcases: [],
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      // Act
      const stream = await graph.stream(state, config)

      // Assert (Output)
      await outputStream(stream)
    })

    it('should validate existing schema successfully', async () => {
      // Arrange
      const graph = new StateGraph(workflowAnnotation)
        .addNode('validateInitialSchema', validateInitialSchemaNode)
        .addEdge(START, 'validateInitialSchema')
        .addEdge('validateInitialSchema', END)
        .compile()

      const { config, context } = await getTestConfig()

      const state: WorkflowState = {
        messages: [new HumanMessage('Update my existing schema')],
        designSessionId: context.designSessionId,
        organizationId: context.organizationId,
        userId: context.userId,
        userInput: 'Update my existing schema',
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
          enums: {},
          extensions: {},
        }),
        analyzedRequirements: undefined,
        testcases: [],
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      // Act
      const stream = await graph.stream(state, config)

      // Assert (Output)
      await outputStream(stream)
    })
  })

  describe('Non-first execution scenarios', () => {
    it('should skip validation when AI messages already exist', async () => {
      // Arrange
      const graph = new StateGraph(workflowAnnotation)
        .addNode('validateInitialSchema', validateInitialSchemaNode)
        .addEdge(START, 'validateInitialSchema')
        .addEdge('validateInitialSchema', END)
        .compile()

      const { config, context } = await getTestConfig()

      const state: WorkflowState = {
        messages: [
          new HumanMessage('First message'),
          new AIMessage('AI response'), // This indicates non-first execution
          new HumanMessage('Follow-up message'),
        ],
        designSessionId: context.designSessionId,
        organizationId: context.organizationId,
        userId: context.userId,
        userInput: 'Follow-up message',
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
              },
            }),
          },
          enums: {},
          extensions: {},
        }),
        analyzedRequirements: undefined,
        testcases: [],
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      // Act
      const stream = await graph.stream(state, config)

      // Assert (Output)
      await outputStream(stream)
    })
  })

  describe('Error handling scenarios', () => {
    it('should handle getSchema repository errors gracefully', async () => {
      // Arrange
      const graph = new StateGraph(workflowAnnotation)
        .addNode('validateInitialSchema', validateInitialSchemaNode)
        .addEdge(START, 'validateInitialSchema')
        .addEdge('validateInitialSchema', END)
        .compile()

      const { config, context } = await getTestConfig()

      const state: WorkflowState = {
        messages: [new HumanMessage('Test repository error')],
        designSessionId: 'invalid-session-id', // This should cause getSchema to fail
        organizationId: context.organizationId,
        userId: context.userId,
        userInput: 'Test repository error',
        schemaData: aSchema({
          tables: {},
          enums: {},
          extensions: {},
        }),
        analyzedRequirements: undefined,
        testcases: [],
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      // Act
      const stream = await graph.stream(state, config)

      // Assert (Output)
      await outputStream(stream)
    })
  })
})
