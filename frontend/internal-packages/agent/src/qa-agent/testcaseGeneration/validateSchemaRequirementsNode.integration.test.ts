import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import type { testcaseAnnotation } from './testcaseAnnotation'
import { validateSchemaRequirementsNode } from './validateSchemaRequirementsNode'

describe('validateSchemaRequirementsNode Integration', () => {
  it('validates schema as sufficient when all required elements exist', async () => {
    // Arrange
    type TestcaseState = typeof testcaseAnnotation.State

    const state: TestcaseState = {
      messages: [],
      currentRequirement: {
        type: 'functional',
        category: 'tasks',
        requirement: 'Users can create tasks with title and status',
        businessContext:
          'A task management system where users create projects and tasks',
      },
      schemaContext: `
Table: users
- id: uuid (not null)
- email: varchar (not null)

Table: tasks
- id: uuid (not null)
- user_id: uuid (not null)
- title: varchar (not null)
- status: varchar (not null)
      `,
      testcases: [],
      schemaIssues: [],
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

    const state: TestcaseState = {
      messages: [],
      currentRequirement: {
        type: 'functional',
        category: 'project-management',
        requirement:
          'Users can create projects with clients and assign tasks to specific projects with deadlines and priority levels',
        businessContext:
          'A comprehensive project management system where users manage multiple client projects with detailed task assignment',
      },
      // Limited schema - missing projects/clients tables and deadline/priority columns
      schemaContext: `
Table: users
- id: uuid (not null)
- email: varchar (not null)

Table: tasks
- id: uuid (not null)
- user_id: uuid (not null)
- title: varchar (not null)
- status: varchar (not null)
      `,
      testcases: [],
      schemaIssues: [],
    }

    // Act
    const command = await validateSchemaRequirementsNode(state)

    // Assert - Should update schemaIssues and route to END (insufficient schema)
    // biome-ignore lint/suspicious/noConsole: Testing
    console.dir({ command }, { depth: null })
    expect(command.goto).toEqual([END])
  })
})
