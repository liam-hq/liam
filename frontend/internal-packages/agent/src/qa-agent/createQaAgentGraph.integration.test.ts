import { HumanMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStreamEvents,
} from '../../test-utils/workflowTestHelpers'
import { createQaAgentGraph } from './createQaAgentGraph'
import type { QaAgentState } from './shared/qaAgentAnnotation'

describe('createQaAgentGraph Integration', () => {
  it('should execute complete QA agent workflow with real APIs', async () => {
    // Arrange
    const graph = createQaAgentGraph()
    const { config, context } = await getTestConfig()

    const userInput =
      'Generate comprehensive test cases for user authentication and role-based access control'

    // Sample schema data for testing
    const schemaData = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            email: aColumn({
              name: 'email',
              type: 'varchar(255)',
              notNull: true,
            }),
            password_hash: aColumn({
              name: 'password_hash',
              type: 'varchar(255)',
              notNull: true,
            }),
            role_id: aColumn({ name: 'role_id', type: 'uuid', notNull: true }),
            created_at: aColumn({
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            }),
            is_active: aColumn({
              name: 'is_active',
              type: 'boolean',
              default: true,
            }),
          },
        }),
        roles: aTable({
          name: 'roles',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            name: aColumn({
              name: 'name',
              type: 'varchar(100)',
              notNull: true,
            }),
            description: aColumn({ name: 'description', type: 'text' }),
            permissions: aColumn({ name: 'permissions', type: 'jsonb' }),
            created_at: aColumn({
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            }),
          },
        }),
      },
      extensions: { 'uuid-ossp': { name: 'uuid-ossp' } },
    })

    const state: QaAgentState = {
      messages: [new HumanMessage(userInput)],
      schemaData,
      analyzedRequirements: {
        goal: 'Implement secure user authentication and role-based access control system',
        testcases: {
          Authentication: [
            {
              id: '1',
              title:
                'Users should be able to register with valid email and password',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: '2',
              title: 'Users should be able to login with correct credentials',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: '3',
              title:
                'System should validate email format and password strength',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
          ],
          Authorization: [
            {
              id: '4',
              title: 'Only admin users should be able to create new roles',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: '5',
              title: 'Users should only access resources allowed by their role',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: '6',
              title:
                'System should enforce role-based permissions on all endpoints',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
          ],
        },
      },
      designSessionId: context.designSessionId,
      buildingSchemaId: context.buildingSchemaId,
      schemaIssues: [],
      generatedSqls: [],
      next: END,
    }

    // Act
    const streamEvents = graph.streamEvents(state, {
      ...config,
      streamMode: 'messages',
      version: 'v2',
    })

    // Assert (Output)
    await outputStreamEvents(streamEvents)
  })
})
