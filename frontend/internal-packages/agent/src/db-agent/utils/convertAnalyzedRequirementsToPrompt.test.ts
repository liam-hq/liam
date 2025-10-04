import { describe, expect, it } from 'vitest'
import type { AnalyzedRequirements } from '../../utils/schema/analyzedRequirements'
import { convertRequirementsToPrompt } from './convertAnalyzedRequirementsToPrompt'

describe('convertAnalyzedRequirementsToPrompt', () => {
  const sampleAnalyzedRequirements: AnalyzedRequirements = {
    goal: 'Build a user management system',
    testcases: {
      authentication: [
        {
          id: '1',
          title: 'User login',
          type: 'SELECT',
          sql: '',
          testResults: [],
        },
        {
          id: '2',
          title: 'User logout',
          type: 'UPDATE',
          sql: '',
          testResults: [],
        },
        {
          id: '3',
          title: 'Password reset',
          type: 'UPDATE',
          sql: '',
          testResults: [],
        },
      ],
      userManagement: [
        {
          id: '4',
          title: 'Create new user',
          type: 'INSERT',
          sql: '',
          testResults: [],
        },
        {
          id: '5',
          title: 'Update user info',
          type: 'UPDATE',
          sql: '',
          testResults: [],
        },
        {
          id: '6',
          title: 'Delete user',
          type: 'DELETE',
          sql: '',
          testResults: [],
        },
      ],
    },
  }

  it('should convert analyzed requirements to formatted text prompt', () => {
    const result = convertRequirementsToPrompt(sampleAnalyzedRequirements)

    expect(result).toMatchInlineSnapshot(`
      "Session Goal: Build a user management system

      Test Cases:
      - authentication: User login (SELECT), User logout (UPDATE), Password reset (UPDATE)
      - userManagement: Create new user (INSERT), Update user info (UPDATE), Delete user (DELETE)"
    `)
  })

  it('should handle empty testcases objects', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Simple system',
      testcases: {},
    }

    const result = convertRequirementsToPrompt(analyzedRequirements)

    expect(result).toMatchInlineSnapshot(`
      "Session Goal: Simple system

      Test Cases:"
    `)
  })

  it('should handle empty goal', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: '',
      testcases: {
        basic: [
          {
            id: '1',
            title: 'Basic feature test',
            type: 'INSERT',
            sql: '',
            testResults: [],
          },
        ],
      },
    }

    const result = convertRequirementsToPrompt(analyzedRequirements)

    expect(result).toMatchInlineSnapshot(`
      "Session Goal:

      Test Cases:
      - basic: Basic feature test (INSERT)"
    `)
  })

  describe('with schemaIssues filtering', () => {
    it('should filter testcases based on schemaIssues without showing issue details', () => {
      const schemaIssues = [
        { testcaseId: '2', description: 'Missing logout table' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      expect(result).toMatchInlineSnapshot(`
        "Session Goal: Build a user management system

        Test Cases:
        - authentication: User logout (UPDATE)"
      `)
    })

    it('should handle empty schemaIssues array', () => {
      const schemaIssues: Array<{
        testcaseId: string
        description: string
      }> = []

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      // Should behave like no schemaIssues parameter
      expect(result).toMatchInlineSnapshot(`
        "Session Goal: Build a user management system

        Test Cases:
        - authentication: User login (SELECT), User logout (UPDATE), Password reset (UPDATE)
        - userManagement: Create new user (INSERT), Update user info (UPDATE), Delete user (DELETE)"
      `)
    })

    it('should filter out entire categories when no testcases match schemaIssues', () => {
      const schemaIssues = [
        { testcaseId: '1', description: 'Login form missing' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      expect(result).toMatchInlineSnapshot(`
        "Session Goal: Build a user management system

        Test Cases:
        - authentication: User login (SELECT)"
      `)
    })

    it('should handle schemaIssues with no matching testcases', () => {
      const schemaIssues = [
        {
          testcaseId: 'non-existent',
          description: 'Non-existent testcase issue',
        },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      expect(result).toMatchInlineSnapshot(`
        "Session Goal: Build a user management system

        Test Cases:"
      `)
    })

    it('should filter testcases without showing IDs or issue details', () => {
      const schemaIssues = [
        { testcaseId: '4', description: 'User table structure issue' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      expect(result).toContain('Create new user')
      expect(result).not.toContain('[4]')
      expect(result).not.toContain('User table structure issue')
    })
  })
})
