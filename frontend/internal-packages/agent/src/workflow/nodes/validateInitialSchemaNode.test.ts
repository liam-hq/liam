import { ChatMessage, HumanMessage } from '@langchain/core/messages'
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
        userInput: 'Create a new database schema',
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
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      const result = await graph.invoke(state, config)

      expect(result.messages).toHaveLength(2)
      expect(result.messages[1]).toBeInstanceOf(ChatMessage)
      expect(result.messages[1]).toMatchObject({
        content: expect.stringContaining('**Instant Database Ready**'),
        role: 'operational',
        additional_kwargs: {
          messageType: 'info',
        },
      })
      expect(result.next).toBe('leadAgent')
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
        analyzedRequirements: {
          businessRequirement: '',
          functionalRequirements: {},
          nonFunctionalRequirements: {},
        },
        testcases: [],
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      const result = await graph.invoke(state, config)

      expect(result.messages).toHaveLength(2)
      expect(result.messages[1]).toBeInstanceOf(ChatMessage)
      expect(result.messages[1]).toMatchObject({
        content: expect.stringContaining('**Instant Database Ready**'),
        role: 'operational',
        additional_kwargs: {
          messageType: 'info',
        },
      })
      expect(result.next).toBe('leadAgent')
    }, 30000) // 30 second timeout for CI/preview environments
  })

  describe('Non-first execution scenarios', () => {
    it('should still validate when called directly (routing logic tested elsewhere)', async () => {
      const graph = new StateGraph(workflowAnnotation)
        .addNode('validateInitialSchema', validateInitialSchemaNode)
        .addEdge(START, 'validateInitialSchema')
        .addEdge('validateInitialSchema', END)
        .compile()

      const { config, context } = await getTestConfig({ useOpenAI: false })

      const state: WorkflowState = {
        messages: [
          new HumanMessage('First message'),
          new ChatMessage({
            content: 'AI response',
            role: 'assistant',
          }), // This indicates non-first execution
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
        analyzedRequirements: {
          businessRequirement: '',
          functionalRequirements: {},
          nonFunctionalRequirements: {},
        },
        testcases: [],
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      const result = await graph.invoke(state, config)

      expect(result.messages).toHaveLength(4)
      expect(result.messages[3]).toBeInstanceOf(ChatMessage)
      expect(result.messages[3]).toMatchObject({
        content: expect.stringContaining('**Instant Database Ready**'),
        role: 'operational',
        additional_kwargs: {
          messageType: 'info',
        },
      })
      expect(result.next).toBe('leadAgent')
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
        userInput: 'Test validation error with invalid DDL',
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
        buildingSchemaId: 'test-building-schema-id',
        latestVersionNumber: 1,
        next: 'leadAgent',
      }

      const result = await validateInitialSchemaNode.invoke(state)

      expect(result.messages).toHaveLength(2)
      expect(result.messages[1]).toBeInstanceOf(ChatMessage)
      expect(result.messages[1]).toMatchObject({
        content: expect.stringContaining('**Instant Database Startup Failed**'),
        role: 'operational',
        additional_kwargs: {
          messageType: 'error',
        },
      })
      expect(result.next).toBe(END)
    }, 30000) // 30 second timeout for CI/preview environments
  })
})
