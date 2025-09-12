import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { describe, expect, it } from 'vitest'
import { getTestConfig } from '../../../test-utils/workflowTestHelpers'
import type { WorkflowState } from '../../types'
import { workflowAnnotation } from '../../workflowAnnotation'
import { validateInitialSchemaNode } from './validateInitialSchemaNode'

describe('validateInitialSchemaNode Integration', () => {
  describe('First execution scenarios', () => {
    it('should display fresh database message when schema is empty', async () => {
      const graph = new StateGraph(workflowAnnotation)
        .addNode('validateInitialSchema', validateInitialSchemaNode)
        .addEdge(START, 'validateInitialSchema')
        .addEdge('validateInitialSchema', END)
        .compile()

      const { config, context } = await getTestConfig({ useOpenAI: false })

      const state: WorkflowState = {
        messages: [new HumanMessage('Create a new database schema')],
        designSessionId: context.designSessionId,
        organizationId: context.organizationId,
        userId: context.userId,
        schemaData: aSchema({
          tables: {},
          enums: {},
          extensions: {},
        }),
        analyzedRequirements: {
          businessRequirement: '',
          functionalRequirements: {},
          nonFunctionalRequirements: {},
        },
        testcases: [],
        schemaIssues: [],
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      const result = await graph.invoke(state, config)

      // Assert
      // Empty schema should return unchanged state
      expect(result).toEqual(state)
    })

    it('should validate existing schema successfully', async () => {
      const graph = new StateGraph(workflowAnnotation)
        .addNode('validateInitialSchema', validateInitialSchemaNode)
        .addEdge(START, 'validateInitialSchema')
        .addEdge('validateInitialSchema', END)
        .compile()

      const { config, context } = await getTestConfig({ useOpenAI: false })

      const state: WorkflowState = {
        messages: [new HumanMessage('Update my existing schema')],
        designSessionId: context.designSessionId,
        organizationId: context.organizationId,
        userId: context.userId,
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
        analyzedRequirements: {
          businessRequirement: '',
          functionalRequirements: {},
          nonFunctionalRequirements: {},
        },
        testcases: [],
        schemaIssues: [],
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      const result = await graph.invoke(state, config)

      expect(result).toEqual(state)
    }, 30000) // 30 second timeout for CI/preview environments
  })

  describe('Non-first execution scenarios', () => {
    it('should skip validation when AI messages already exist', async () => {
      const graph = new StateGraph(workflowAnnotation)
        .addNode('validateInitialSchema', validateInitialSchemaNode)
        .addEdge(START, 'validateInitialSchema')
        .addEdge('validateInitialSchema', END)
        .compile()

      const { config, context } = await getTestConfig({ useOpenAI: false })

      const state: WorkflowState = {
        messages: [
          new HumanMessage('First message'),
          new AIMessage('AI response'), // This indicates non-first execution
          new HumanMessage('Follow-up message'),
        ],
        designSessionId: context.designSessionId,
        organizationId: context.organizationId,
        userId: context.userId,
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
        analyzedRequirements: {
          businessRequirement: '',
          functionalRequirements: {},
          nonFunctionalRequirements: {},
        },
        testcases: [],
        schemaIssues: [],
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      const result = await graph.invoke(state, config)

      expect(result).toEqual(state)
    }, 30000) // 30 second timeout for CI/preview environments
  })

  describe('Error handling scenarios', () => {
    it('should fail when schema contains invalid column type', async () => {
      const { context } = await getTestConfig({ useOpenAI: false })

      const state: WorkflowState = {
        messages: [new HumanMessage('Test validation error with invalid DDL')],
        designSessionId: context.designSessionId,
        organizationId: context.organizationId,
        userId: context.userId,
        schemaData: aSchema({
          tables: {
            invalid_table: aTable({
              name: 'invalid_table',
              columns: {
                bad_column: aColumn({
                  name: 'bad_column',
                  type: 'unknown_invalid_type', // This will cause DDL validation to fail
                  notNull: true,
                }),
              },
            }),
          },
          enums: {},
          extensions: {},
        }),
        analyzedRequirements: {
          businessRequirement: '',
          functionalRequirements: {},
          nonFunctionalRequirements: {},
        },
        testcases: [],
        schemaIssues: [],
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      const result = await validateInitialSchemaNode(state)

      expect(result.next).toBe('__end__')
      expect(result.messages).toHaveLength(1) // Only original message, error message is TODO
      expect(result.messages[0]).toEqual(state.messages[0]) // Original message unchanged
    }, 30000) // 30 second timeout for CI/preview environments
  })
})
