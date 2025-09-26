import { HumanMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { v4 as uuidv4 } from 'uuid'
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
        businessRequirement:
          'Implement secure user authentication and role-based access control system',
        functionalRequirements: {
          Authentication: [
            {
              id: uuidv4(),
              desc: 'Users should be able to register with valid email and password',
            },
            {
              id: uuidv4(),
              desc: 'Users should be able to login with correct credentials',
            },
            {
              id: uuidv4(),
              desc: 'System should validate email format and password strength',
            },
          ],
          Authorization: [
            {
              id: uuidv4(),
              desc: 'Only admin users should be able to create new roles',
            },
            {
              id: uuidv4(),
              desc: 'Users should only access resources allowed by their role',
            },
            {
              id: uuidv4(),
              desc: 'System should enforce role-based permissions on all endpoints',
            },
          ],
        },
      },
      testcases: [],
      designSessionId: context.designSessionId,
      buildingSchemaId: context.buildingSchemaId,
      schemaIssues: [],
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
