import { describe, expect, it } from 'vitest'
import type { AnalyzedRequirements } from '../../utils/schema/analyzedRequirements'
import { convertRequirementsToPrompt } from './convertAnalyzedRequirementsToPrompt'

describe('convertAnalyzedRequirementsToPrompt', () => {
  const sampleAnalyzedRequirements: AnalyzedRequirements = {
    goal: 'Build a user management system',
    testcases: {
      authentication: [
        {
          title: 'Login',
          type: 'SELECT',
          sql: 'SELECT * FROM users',
          testResults: [],
        },
        {
          title: 'Logout',
          type: 'UPDATE',
          sql: 'UPDATE sessions',
          testResults: [],
        },
        {
          title: 'Password reset',
          type: 'UPDATE',
          sql: 'UPDATE users',
          testResults: [],
        },
      ],
      userManagement: [
        {
          title: 'Create user',
          type: 'INSERT',
          sql: 'INSERT INTO users',
          testResults: [],
        },
        {
          title: 'Update user',
          type: 'UPDATE',
          sql: 'UPDATE users',
          testResults: [],
        },
        {
          title: 'Delete user',
          type: 'DELETE',
          sql: 'DELETE FROM users',
          testResults: [],
        },
      ],
    },
  }

  it('should convert analyzed requirements to formatted text prompt', () => {
    const result = convertRequirementsToPrompt(sampleAnalyzedRequirements)

    expect(result).toMatchInlineSnapshot(`
      "Goal: Build a user management system

      Test Cases:
      - authentication: Login (SELECT), Logout (UPDATE), Password reset (UPDATE)
      - userManagement: Create user (INSERT), Update user (UPDATE), Delete user (DELETE)"
    `)
  })

  it('should handle empty requirements objects', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Simple system',
      testcases: {},
    }

    const result = convertRequirementsToPrompt(analyzedRequirements)

    expect(result).toMatchInlineSnapshot(`
      "Goal: Simple system

      Test Cases:"
    `)
  })

  it('should handle empty business requirement', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: '',
      testcases: {
        basic: [
          {
            title: 'feature1',
            type: 'SELECT',
            sql: 'SELECT *',
            testResults: [],
          },
        ],
      },
    }

    const result = convertRequirementsToPrompt(analyzedRequirements)

    expect(result).toMatchInlineSnapshot(`
      "Goal: 

      Test Cases:
      - basic: feature1 (SELECT)"
    `)
  })

  describe('with schemaIssues filtering', () => {
    it('should filter requirements based on schemaIssues without showing issue details', () => {
      const schemaIssues = [
        { requirementId: '2', description: 'Missing logout table' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      expect(result).toMatchInlineSnapshot(`
        "Goal: Build a user management system

        Test Cases:
        - authentication: Logout (UPDATE)"
      `)
    })

    it('should handle empty schemaIssues array', () => {
      const schemaIssues: Array<{
        requirementId: string
        description: string
      }> = []

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      // Should behave like no schemaIssues parameter
      expect(result).toMatchInlineSnapshot(`
        "Goal: Build a user management system

        Test Cases:
        - authentication: Login (SELECT), Logout (UPDATE), Password reset (UPDATE)
        - userManagement: Create user (INSERT), Update user (UPDATE), Delete user (DELETE)"
      `)
    })

    it('should filter out entire categories when no requirements match schemaIssues', () => {
      const schemaIssues = [
        { requirementId: '1', description: 'Login form missing' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      expect(result).toMatchInlineSnapshot(`
        "Goal: Build a user management system

        Test Cases:
        - authentication: Login (SELECT)"
      `)
    })

    it('should handle schemaIssues with no matching requirements', () => {
      const schemaIssues = [
        {
          requirementId: 'non-existent',
          description: 'Non-existent requirement issue',
        },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      expect(result).toMatchInlineSnapshot(`
        "Goal: Build a user management system

        Test Cases:"
      `)
    })

    it('should filter requirements without showing IDs or issue details', () => {
      const schemaIssues = [
        { requirementId: '4', description: 'User table structure issue' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      expect(result).toContain('Create user')
      expect(result).not.toContain('[4]')
      expect(result).not.toContain('User table structure issue')
    })
  })
})
