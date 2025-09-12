import { HumanMessage } from '@langchain/core/messages'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStreamEvents,
} from '../../test-utils/workflowTestHelpers'
import { createPmAgentGraph } from './createPmAgentGraph'
import type { PmAgentState } from './pmAgentAnnotations'

describe('createPmAgentGraph Integration', () => {
  it('should execute complete PM agent workflow with real APIs', async () => {
    // Arrange
    const graph = createPmAgentGraph()
    const { config, context } = await getTestConfig()

    const userInput =
      'I want to build a task management system where users can create projects, add tasks to projects, and track their progress. Users should be able to assign tasks to team members and set deadlines.'

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
            name: aColumn({
              name: 'name',
              type: 'varchar(255)',
              notNull: true,
            }),
            created_at: aColumn({
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            }),
          },
        }),
        projects: aTable({
          name: 'projects',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            name: aColumn({
              name: 'name',
              type: 'varchar(255)',
              notNull: true,
            }),
            description: aColumn({ name: 'description', type: 'text' }),
            owner_id: aColumn({
              name: 'owner_id',
              type: 'uuid',
              notNull: true,
            }),
            created_at: aColumn({
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            }),
          },
        }),
        tasks: aTable({
          name: 'tasks',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            title: aColumn({
              name: 'title',
              type: 'varchar(255)',
              notNull: true,
            }),
            description: aColumn({ name: 'description', type: 'text' }),
            project_id: aColumn({
              name: 'project_id',
              type: 'uuid',
              notNull: true,
            }),
            assignee_id: aColumn({ name: 'assignee_id', type: 'uuid' }),
            status: aColumn({
              name: 'status',
              type: 'varchar(50)',
              default: 'todo',
            }),
            deadline: aColumn({ name: 'deadline', type: 'timestamp' }),
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

    const state: PmAgentState = {
      messages: [new HumanMessage(userInput)],
      schemaData,
      analyzedRequirements: {
        businessRequirement: '',
        functionalRequirements: {},
        nonFunctionalRequirements: {},
      },
      designSessionId: context.designSessionId,
      analyzedRequirementsRetryCount: 0,
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
