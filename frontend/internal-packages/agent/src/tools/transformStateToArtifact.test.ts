import { describe, expect, it } from 'vitest'
import type { Testcase } from '../qa-agent/types'
import type { AnalyzedRequirements } from '../utils/schema/analyzedRequirements'
import { transformStateToArtifact } from './transformStateToArtifact'

describe('transformStateToArtifact', () => {
  it('transforms analyzed requirements to artifact format', () => {
    const state = {
      analyzedRequirements: {
        businessRequirement: 'User management system',
        functionalRequirements: {
          'user-registration': [
            { id: 'req-1', desc: 'Users can create accounts' },
            { id: 'req-2', desc: 'Email verification required' },
          ],
          'user-login': [
            { id: 'req-3', desc: 'Users can authenticate' },
            { id: 'req-4', desc: 'Password reset available' },
          ],
        },
        nonFunctionalRequirements: {
          performance: [{ id: 'req-5', desc: 'Response time < 200ms' }],
          security: [
            { id: 'req-6', desc: 'Data encryption' },
            { id: 'req-7', desc: 'HTTPS only' },
          ],
        },
      } satisfies AnalyzedRequirements,
      testcases: [],
    }

    const result = transformStateToArtifact(state)

    expect(result).toEqual({
      requirement_analysis: {
        business_requirement: 'User management system',
        requirements: [
          {
            type: 'functional',
            name: 'user-registration',
            description: [
              'Users can create accounts',
              'Email verification required',
            ],
            test_cases: [],
          },
          {
            type: 'functional',
            name: 'user-login',
            description: ['Users can authenticate', 'Password reset available'],
            test_cases: [],
          },
          {
            type: 'non_functional',
            name: 'performance',
            description: ['Response time < 200ms'],
          },
          {
            type: 'non_functional',
            name: 'security',
            description: ['Data encryption', 'HTTPS only'],
          },
        ],
      },
    })
  })

  it('merges testcases into functional requirements by category', () => {
    const state = {
      analyzedRequirements: {
        businessRequirement: 'User management system',
        functionalRequirements: {
          'user-registration': [
            { id: 'req-1', desc: 'Users can create accounts' },
          ],
        },
        nonFunctionalRequirements: {},
      } satisfies AnalyzedRequirements,
      testcases: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          requirementId: 'req-1', // matches the requirement item ID
          requirementType: 'functional',
          requirementCategory: 'user-registration',
          requirement: 'Users can create accounts',
          title: 'Valid user registration',
          description: 'User provides valid email and password',
          dmlOperation: {
            operation_type: 'INSERT' as const,
            sql: 'INSERT INTO users (email, password) VALUES (?, ?)',
            dml_execution_logs: [],
          },
        } satisfies Testcase,
      ],
    }

    const result = transformStateToArtifact(state)

    expect(result.requirement_analysis.requirements[0]).toEqual({
      type: 'functional',
      name: 'user-registration',
      description: ['Users can create accounts'],
      test_cases: [
        {
          title: 'Valid user registration',
          description: 'User provides valid email and password',
          dmlOperation: {
            operation_type: 'INSERT',
            sql: 'INSERT INTO users (email, password) VALUES (?, ?)',
            dml_execution_logs: [],
          },
        },
      ],
    })
  })

  it('ignores testcases for non-existent requirement ids', () => {
    const state = {
      analyzedRequirements: {
        businessRequirement: 'Test system',
        functionalRequirements: {},
        nonFunctionalRequirements: {},
      } satisfies AnalyzedRequirements,
      testcases: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          requirementId: 'non-existent-id',
          requirementType: 'functional',
          requirementCategory: 'non-existent-category',
          requirement: 'Some requirement',
          title: 'Test case',
          description: 'Test description',
          dmlOperation: {
            operation_type: 'SELECT' as const,
            sql: 'SELECT * FROM test',
            dml_execution_logs: [],
          },
        } satisfies Testcase,
      ],
    }

    const result = transformStateToArtifact(state)

    expect(result.requirement_analysis.requirements).toHaveLength(0)
  })

  it('only adds testcases to functional requirements, not non-functional ones', () => {
    const state = {
      analyzedRequirements: {
        businessRequirement: 'Test system',
        functionalRequirements: {
          'user-login': [{ id: 'req-1', desc: 'Users can authenticate' }],
        },
        nonFunctionalRequirements: {
          performance: [{ id: 'req-2', desc: 'Fast response times' }],
        },
      } satisfies AnalyzedRequirements,
      testcases: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          requirementId: 'req-1', // matches functional requirement ID
          requirementType: 'functional',
          requirementCategory: 'user-login',
          requirement: 'Users can authenticate',
          title: 'Login test',
          description: 'User can log in',
          dmlOperation: {
            operation_type: 'SELECT' as const,
            sql: 'SELECT * FROM users WHERE email = ?',
            dml_execution_logs: [],
          },
        } satisfies Testcase,
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          requirementId: 'req-2', // matches non-functional requirement ID
          requirementType: 'non_functional',
          requirementCategory: 'performance',
          requirement: 'Fast response times',
          title: 'Performance test',
          description: 'Response under 200ms',
          dmlOperation: {
            operation_type: 'SELECT' as const,
            sql: 'SELECT COUNT(*) FROM users',
            dml_execution_logs: [],
          },
        } satisfies Testcase,
      ],
    }

    const result = transformStateToArtifact(state)

    const functionalReq = result.requirement_analysis.requirements.find(
      (r) => r.name === 'user-login',
    )
    const nonFunctionalReq = result.requirement_analysis.requirements.find(
      (r) => r.name === 'performance',
    )

    expect(functionalReq).toEqual({
      type: 'functional',
      name: 'user-login',
      description: ['Users can authenticate'],
      test_cases: [
        {
          title: 'Login test',
          description: 'User can log in',
          dmlOperation: {
            operation_type: 'SELECT',
            sql: 'SELECT * FROM users WHERE email = ?',
            dml_execution_logs: [],
          },
        },
      ],
    })

    expect(nonFunctionalReq).toEqual({
      type: 'non_functional',
      name: 'performance',
      description: ['Fast response times'],
    })
  })
})
