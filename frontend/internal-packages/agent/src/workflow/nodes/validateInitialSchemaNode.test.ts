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
    it('should validate existing schema successfully', async () => {
      const { config, context, checkpointer } = await getTestConfig({
        useOpenAI: false,
      })
      const graph = new StateGraph(workflowAnnotation)
        .addNode('validateInitialSchema', validateInitialSchemaNode)
        .addEdge(START, 'validateInitialSchema')
        .addEdge('validateInitialSchema', END)
        .compile({ checkpointer })

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
          goal: '',
          testcases: {},
        },
        schemaIssues: [],
        buildingSchemaId: 'test-building-schema-id',
        next: 'leadAgent',
      }

      const result = await graph.invoke(state, config)

      expect(result).toEqual(state)
    }, 30000) // 30 second timeout for CI/preview environments
  })

  describe('Non-first execution scenarios', () => {
    it('should skip validation when AI messages already exist', async () => {
      const { config, context, checkpointer } = await getTestConfig({
        useOpenAI: false,
      })
      const graph = new StateGraph(workflowAnnotation)
        .addNode('validateInitialSchema', validateInitialSchemaNode)
        .addEdge(START, 'validateInitialSchema')
        .addEdge('validateInitialSchema', END)
        .compile({ checkpointer })

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
          goal: '',
          testcases: {},
        },
        schemaIssues: [],
        buildingSchemaId: 'test-building-schema-id',
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
          goal: '',
          testcases: {},
        },
        schemaIssues: [],
        buildingSchemaId: 'test-building-schema-id',
        next: 'leadAgent',
      }

      await expect(validateInitialSchemaNode(state)).rejects.toThrowError(
        'Error in validateInitialSchemaNode: Schema validation failed: {"error":"type \\"unknown_invalid_type\\" does not exist"}',
      )
    }, 30000) // 30 second timeout for CI/preview environments
  })
})
