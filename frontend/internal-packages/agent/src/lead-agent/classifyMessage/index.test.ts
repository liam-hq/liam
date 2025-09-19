import { END } from '@langchain/langgraph'
import { describe, expect, it } from 'vitest'
import type { WorkflowState } from '../../types'
import { classifyMessage } from './index'

const createMockState = (
  overrides: Partial<WorkflowState> = {},
): WorkflowState => ({
  messages: [],
  analyzedRequirements: {
    businessRequirement: '',
    functionalRequirements: {},
    nonFunctionalRequirements: {},
  },
  testcases: [],
  schemaIssues: [],
  schemaData: { tables: {}, enums: {}, extensions: {} },
  buildingSchemaId: 'test-schema-id',
  latestVersionNumber: 1,
  organizationId: 'test-org-id',
  userId: 'test-user-id',
  designSessionId: 'test-session-id',
  next: END,
  ...overrides,
})

describe('classifyMessage', () => {
  it('should route to dbAgent when schema issues exist', async () => {
    const state = createMockState({
      schemaIssues: [
        {
          requirementId: 'req-1',
          description: 'Missing foreign key constraint',
        },
      ],
    })

    const result = await classifyMessage(state)

    expect(result.goto).toEqual([END])
    expect(result.update).toEqual({ next: 'dbAgent' })
  })

  it('should route to dbAgent when multiple schema issues exist', async () => {
    const state = createMockState({
      schemaIssues: [
        {
          requirementId: 'req-1',
          description: 'Missing foreign key constraint',
        },
        { requirementId: 'req-2', description: 'Invalid table name' },
      ],
    })

    const result = await classifyMessage(state)

    expect(result.goto).toEqual([END])
    expect(result.update).toEqual({ next: 'dbAgent' })
  })

  it('should prioritize schema issues over QA completion', async () => {
    const state = createMockState({
      schemaIssues: [
        { requirementId: 'req-1', description: 'Schema issue found' },
      ],
      testcases: [
        {
          id: 'test-1',
          requirementId: 'req-1',
          requirementType: 'functional',
          requirementCategory: 'test',
          requirement: 'Test requirement',
          title: 'Test case',
          description: 'Test case',
          dmlOperation: {
            operation_type: 'SELECT',
            sql: 'SELECT 1',
            dml_execution_logs: [],
          },
        },
      ],
    })

    const result = await classifyMessage(state)

    expect(result.goto).toEqual([END])
    expect(result.update).toEqual({ next: 'dbAgent' })
  })

  it('should route to summarizeWorkflow when QA completed and no schema issues', async () => {
    const state = createMockState({
      schemaIssues: [],
      testcases: [
        {
          id: 'test-1',
          requirementId: 'req-1',
          requirementType: 'functional',
          requirementCategory: 'test',
          requirement: 'Test requirement',
          title: 'Test case',
          description: 'Test case',
          dmlOperation: {
            operation_type: 'SELECT',
            sql: 'SELECT 1',
            dml_execution_logs: [],
          },
        },
      ],
    })

    const result = await classifyMessage(state)

    expect(result.goto).toEqual(['summarizeWorkflow'])
    expect(result.update).toBeUndefined()
  })

  it('should route to pmAgent when no schema issues and QA not completed', async () => {
    const state = createMockState({
      schemaIssues: [],
      testcases: [],
    })

    const result = await classifyMessage(state)

    expect(result.goto).toEqual([END])
    expect(result.update).toEqual({ next: 'pmAgent' })
  })
})
