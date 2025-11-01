import { END } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import { describe, expect, it } from 'vitest'
import type { testcaseAnnotation } from './testcaseAnnotation'
import { validateSchemaRequirementsNode } from './validateSchemaRequirementsNode'

describe('validateSchemaRequirementsNode Integration', () => {
  it('validates schema as sufficient when all required elements exist', async () => {
    // Arrange
    type TestcaseState = typeof testcaseAnnotation.State

    const mockSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'uuid',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            email: {
              name: 'email',
              type: 'varchar',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
        tasks: {
          name: 'tasks',
          columns: {
            id: {
              name: 'id',
              type: 'uuid',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            user_id: {
              name: 'user_id',
              type: 'uuid',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            title: {
              name: 'title',
              type: 'varchar',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            status: {
              name: 'status',
              type: 'varchar',
              notNull: true,
              default: null,
              check: null,
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
    }

    const state: TestcaseState = {
      messages: [],
      internalMessages: [],
      currentTestcase: {
        category: 'tasks',
        testcase: {
          id: '123',
          title: 'Users can create tasks with title and status',
          type: 'INSERT',
          sql: '',
          testResults: [],
        },
      },
      goal: 'A task management system where users create projects and tasks',
      schemaData: mockSchema,
      schemaIssues: [],
      generatedSqls: [],
    }

    // Act
    const command = await validateSchemaRequirementsNode(state)

    // Assert - Should route to generateTestcase (sufficient schema)
    expect(command.goto).toEqual(['generateTestcase'])
    expect(command.update).toBeUndefined()
  })

  it('reports schema issues when required elements are missing', async () => {
    // Arrange
    type TestcaseState = typeof testcaseAnnotation.State

    // Limited schema - missing projects/clients tables and deadline/priority columns
    const mockSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'uuid',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            email: {
              name: 'email',
              type: 'varchar',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
        tasks: {
          name: 'tasks',
          columns: {
            id: {
              name: 'id',
              type: 'uuid',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            user_id: {
              name: 'user_id',
              type: 'uuid',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            title: {
              name: 'title',
              type: 'varchar',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            status: {
              name: 'status',
              type: 'varchar',
              notNull: true,
              default: null,
              check: null,
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
    }

    const state: TestcaseState = {
      messages: [],
      internalMessages: [],
      currentTestcase: {
        category: 'project-management',
        testcase: {
          id: '456',
          title:
            'Users can create projects with clients and assign tasks to specific projects with deadlines and priority levels',
          type: 'INSERT',
          sql: '',
          testResults: [],
        },
      },
      goal: 'A comprehensive project management system where users manage multiple client projects with detailed task assignment',
      schemaData: mockSchema,
      schemaIssues: [],
      generatedSqls: [],
    }

    // Act
    const command = await validateSchemaRequirementsNode(state)

    // Assert - Should update schemaIssues and route to END (insufficient schema)
    // biome-ignore lint/suspicious/noConsole: Testing
    console.dir({ command }, { depth: null })
    expect(command.goto).toEqual([END])
  })
})
