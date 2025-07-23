import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { describe, expect, it } from 'vitest'
import type { DMLOperation } from '../../../langchain/agents/dmlGenerationAgent/agent'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { WorkflowState } from '../types'
import { transformWorkflowStateToArtifact } from './transformWorkflowStateToArtifact'

describe('transformWorkflowStateToArtifact', () => {
  const createMockState = (
    overrides?: Partial<WorkflowState>,
  ): WorkflowState => {
    return {
      messages: [],
      userInput: 'test',
      schemaData: { tables: {} },
      buildingSchemaId: 'test-id',
      latestVersionNumber: 1,
      organizationId: 'test-org-id',
      userId: 'user-id',
      designSessionId: 'session-id',
      retryCount: {},
      ...overrides,
    }
  }

  it('should transform basic workflow state to artifact', () => {
    const state = createMockState({
      analyzedRequirements: {
        businessRequirement: 'Build an e-commerce platform',
        functionalRequirements: {
          'User Management': ['User registration', 'User login'],
          'Product Management': ['Add products', 'Update products'],
        },
        nonFunctionalRequirements: {
          Performance: ['Response time under 2s'],
        },
      },
      generatedUsecases: [
        {
          requirementType: 'functional',
          requirementCategory: 'User Management',
          requirement: 'Users should be able to register and login',
          title: 'User Registration',
          description: 'Allow users to create accounts',
        },
      ],
    })

    const result = transformWorkflowStateToArtifact(state)

    expect(result).toBeDefined()
    expect(result.requirement_analysis.business_requirement).toBe(
      'Build an e-commerce platform',
    )
    expect(result.requirement_analysis.requirements).toHaveLength(1)
    expect(result.requirement_analysis.requirements[0]?.type).toBe('functional')
  })

  it('should include DML operations when available', () => {
    const mockOperations: DMLOperation[] = [
      {
        sql: "INSERT INTO users (email) VALUES ('test@example.com')",
        operationType: 'INSERT',
        purpose: 'Create test user',
        expectedOutcome: 'User created',
        order: 1,
      },
      {
        sql: "SELECT * FROM users WHERE email = 'test@example.com'",
        operationType: 'SELECT',
        purpose: 'Verify user exists',
        expectedOutcome: 'Should return the user',
        order: 2,
      },
    ]

    const usecase: Usecase = {
      requirementType: 'functional',
      requirementCategory: 'User Management',
      requirement: 'Users should be able to register',
      title: 'User Registration',
      description: 'Allow users to create accounts',
    }

    const state = createMockState({
      analyzedRequirements: {
        businessRequirement: 'Build user management system',
        functionalRequirements: {
          'User Management': ['User registration'],
        },
        nonFunctionalRequirements: {},
      },
      generatedUsecases: [usecase],
      dmlOperations: [
        {
          usecase,
          operations: mockOperations,
        },
      ],
    })

    const result = transformWorkflowStateToArtifact(state)

    expect(result.requirement_analysis.requirements).toHaveLength(1)
    const requirement = result.requirement_analysis.requirements[0]
    expect(requirement?.type).toBe('functional')

    if (requirement && requirement.type === 'functional') {
      expect(requirement.use_cases).toHaveLength(1)
      const useCase = requirement.use_cases[0]
      expect(useCase?.dml_operations).toHaveLength(2)
      const firstOperation = useCase?.dml_operations[0]
      if (firstOperation && mockOperations[0]) {
        expect(firstOperation).toMatchObject({
          sql: mockOperations[0].sql,
          operation_type: mockOperations[0].operationType,
          dml_execution_logs: [],
        })
      }
    }
  })

  it('should handle multiple use cases with different DML operations', () => {
    const operations1: DMLOperation[] = [
      {
        sql: "INSERT INTO users (email) VALUES ('user1@test.com')",
        operationType: 'INSERT',
        purpose: 'Create user 1',
        expectedOutcome: 'User 1 created',
        order: 1,
      },
    ]

    const operations2: DMLOperation[] = [
      {
        sql: "INSERT INTO products (name) VALUES ('Product 1')",
        operationType: 'INSERT',
        purpose: 'Create product',
        expectedOutcome: 'Product created',
        order: 1,
      },
    ]

    const usecase1: Usecase = {
      requirementType: 'functional',
      requirementCategory: 'User Management',
      requirement: 'User registration',
      title: 'User Registration',
      description: 'Create new users',
    }

    const usecase2: Usecase = {
      requirementType: 'functional',
      requirementCategory: 'Product Management',
      requirement: 'Product creation',
      title: 'Product Creation',
      description: 'Add new products',
    }

    const state = createMockState({
      analyzedRequirements: {
        businessRequirement: 'E-commerce platform',
        functionalRequirements: {
          'User Management': ['User registration'],
          'Product Management': ['Product creation'],
        },
        nonFunctionalRequirements: {},
      },
      generatedUsecases: [usecase1, usecase2],
      dmlOperations: [
        { usecase: usecase1, operations: operations1 },
        { usecase: usecase2, operations: operations2 },
      ],
    })

    const result = transformWorkflowStateToArtifact(state)

    expect(result.requirement_analysis.requirements).toHaveLength(2)

    const userReq = result.requirement_analysis.requirements.find(
      (r) => r.name === 'User Management',
    )
    const productReq = result.requirement_analysis.requirements.find(
      (r) => r.name === 'Product Management',
    )

    expect(userReq?.type).toBe('functional')
    expect(productReq?.type).toBe('functional')

    if (userReq?.type === 'functional') {
      expect(userReq.use_cases[0]?.dml_operations).toHaveLength(1)
      const firstOp = userReq.use_cases[0]?.dml_operations[0]
      expect(firstOp?.sql).toBe(operations1[0]?.sql)
    }

    if (productReq?.type === 'functional') {
      expect(productReq.use_cases[0]?.dml_operations).toHaveLength(1)
      const firstOp = productReq.use_cases[0]?.dml_operations[0]
      expect(firstOp?.sql).toBe(operations2[0]?.sql)
    }
  })

  it('should handle use cases without DML operations', () => {
    const usecase1: Usecase = {
      requirementType: 'functional',
      requirementCategory: 'User Management',
      requirement: 'User registration',
      title: 'User Registration',
      description: 'Create new users',
    }

    const usecase2: Usecase = {
      requirementType: 'non_functional',
      requirementCategory: 'Performance',
      requirement: 'Fast response times',
      title: 'Performance',
      description: 'System should respond quickly',
    }

    const state = createMockState({
      analyzedRequirements: {
        businessRequirement: 'Build fast system',
        functionalRequirements: {
          'User Management': ['User registration'],
        },
        nonFunctionalRequirements: {
          Performance: ['Fast response times'],
        },
      },
      generatedUsecases: [usecase1, usecase2],
      // No dmlOperations
    })

    const result = transformWorkflowStateToArtifact(state)

    expect(result.requirement_analysis.requirements).toHaveLength(2)

    const functionalReq = result.requirement_analysis.requirements.find(
      (r) => r.type === 'functional',
    )

    if (functionalReq?.type === 'functional') {
      expect(functionalReq.use_cases[0]?.dml_operations).toEqual([])
    }
  })

  it('should handle empty state gracefully', () => {
    const state = createMockState()

    const result = transformWorkflowStateToArtifact(state)

    expect(result).toEqual({
      requirement_analysis: {
        business_requirement: '',
        requirements: [],
      },
    })
  })

  it('should include DML execution results when available', () => {
    const mockOperations: DMLOperation[] = [
      {
        sql: "INSERT INTO users (email) VALUES ('test@example.com')",
        operationType: 'INSERT',
        purpose: 'Create test user',
        expectedOutcome: 'User created',
        order: 1,
      },
      {
        sql: "SELECT * FROM users WHERE email = 'test@example.com'",
        operationType: 'SELECT',
        purpose: 'Verify user exists',
        expectedOutcome: 'Should return the user',
        order: 2,
      },
    ]

    const mockResults: SqlResult[] = [
      {
        success: true,
        sql: mockOperations[0]?.sql ?? '',
        result: { rows: [], columns: [] },
        id: 'result-1',
        metadata: {
          executionTime: 5,
          timestamp: '2024-01-01T12:00:00.000Z',
        },
      },
      {
        success: true,
        sql: mockOperations[1]?.sql ?? '',
        result: {
          rows: [{ id: 1, email: 'test@example.com' }],
          columns: ['id', 'email'],
        },
        id: 'result-2',
        metadata: {
          executionTime: 3,
          timestamp: '2024-01-01T12:00:01.000Z',
        },
      },
    ]

    const usecase: Usecase = {
      requirementType: 'functional',
      requirementCategory: 'User Management',
      requirement: 'Users should be able to register',
      title: 'User Registration',
      description: 'Allow users to create accounts',
    }

    const state = createMockState({
      analyzedRequirements: {
        businessRequirement: 'Build user management system',
        functionalRequirements: {
          'User Management': ['User registration'],
        },
        nonFunctionalRequirements: {},
      },
      generatedUsecases: [usecase],
      dmlOperations: [
        {
          usecase,
          operations: mockOperations,
        },
      ],
      dmlExecutionResults: [
        {
          usecase,
          operationResults: mockOperations.map((operation, index) => ({
            operation,
            result: mockResults[index] || {
              sql: '',
              result: null,
              success: false,
              id: '',
              metadata: {
                executionTime: 0,
                timestamp: new Date().toISOString(),
              },
            },
          })),
        },
      ],
    })

    const result = transformWorkflowStateToArtifact(state)

    expect(result.requirement_analysis.requirements).toHaveLength(1)
    const requirement = result.requirement_analysis.requirements[0]

    if (requirement?.type === 'functional') {
      expect(requirement.use_cases[0]?.dml_operations).toHaveLength(2)

      // Check first operation (INSERT)
      const insertOp = requirement.use_cases[0]?.dml_operations[0]
      expect(insertOp?.dml_execution_logs).toHaveLength(1)
      expect(insertOp?.dml_execution_logs?.[0]).toMatchObject({
        executed_at: '2024-01-01T12:00:00.000Z',
        success: true,
        result_summary: 'Query executed successfully. 0 rows returned.',
      })

      // Check second operation (SELECT)
      const selectOp = requirement.use_cases[0]?.dml_operations[1]
      expect(selectOp?.dml_execution_logs).toHaveLength(1)
      expect(selectOp?.dml_execution_logs?.[0]).toMatchObject({
        executed_at: '2024-01-01T12:00:01.000Z',
        success: true,
        result_summary: 'Query executed successfully. 1 rows returned.',
      })
    }
  })

  it('should handle failed DML executions', () => {
    const mockOperation: DMLOperation = {
      sql: 'INSERT INTO invalid_table VALUES (1)',
      operationType: 'INSERT',
      purpose: 'Test error handling',
      expectedOutcome: 'Should fail',
      order: 1,
    }

    const mockResult: SqlResult = {
      success: false,
      sql: mockOperation.sql,
      result: { error: 'Table invalid_table does not exist' },
      id: 'result-1',
      metadata: {
        executionTime: 2,
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    }

    const usecase: Usecase = {
      requirementType: 'functional',
      requirementCategory: 'Error Testing',
      requirement: 'Test error handling',
      title: 'Error Test',
      description: 'Test failed queries',
    }

    const state = createMockState({
      analyzedRequirements: {
        businessRequirement: 'Test error handling',
        functionalRequirements: {
          'Error Testing': ['Test error handling'],
        },
        nonFunctionalRequirements: {},
      },
      generatedUsecases: [usecase],
      dmlOperations: [
        {
          usecase,
          operations: [mockOperation],
        },
      ],
      dmlExecutionResults: [
        {
          usecase,
          operationResults: [{ operation: mockOperation, result: mockResult }],
        },
      ],
    })

    const result = transformWorkflowStateToArtifact(state)
    const requirement = result.requirement_analysis.requirements[0]

    if (requirement?.type === 'functional') {
      const dmlOp = requirement.use_cases[0]?.dml_operations[0]
      expect(dmlOp?.dml_execution_logs).toHaveLength(1)
      expect(dmlOp?.dml_execution_logs?.[0]).toMatchObject({
        executed_at: '2024-01-01T12:00:00.000Z',
        success: false,
        result_summary: expect.stringContaining('Query failed'),
      })
      expect(dmlOp?.dml_execution_logs?.[0]?.result_summary).toContain(
        'Table invalid_table does not exist',
      )
    }
  })
})
