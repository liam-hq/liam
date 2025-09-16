import { describe, expect, it } from 'vitest'
import type { AnalyzedRequirements } from '../../utils/schema/analyzedRequirements'
import { convertRequirementsToPrompt } from './convertAnalyzedRequirementsToPrompt'

describe('convertAnalyzedRequirementsToPrompt', () => {
  const sampleAnalyzedRequirements: AnalyzedRequirements = {
    businessRequirement: 'Build a user management system',
    functionalRequirements: {
      authentication: [
        { id: '1', desc: 'Login' },
        { id: '2', desc: 'Logout' },
        { id: '3', desc: 'Password reset' },
      ],
      userManagement: [
        { id: '4', desc: 'Create user' },
        { id: '5', desc: 'Update user' },
        { id: '6', desc: 'Delete user' },
      ],
    },
    nonFunctionalRequirements: {
      security: [
        { id: '7', desc: 'Password encryption' },
        { id: '8', desc: 'Session management' },
      ],
      performance: [{ id: '9', desc: 'Fast response times' }],
    },
  }

  it('should convert analyzed requirements to formatted text prompt', () => {
    const result = convertRequirementsToPrompt(sampleAnalyzedRequirements)

    expect(result).toMatchInlineSnapshot(`
      "Business Requirement: Build a user management system

      Functional Requirements:
      - authentication: Login, Logout, Password reset
      - userManagement: Create user, Update user, Delete user

      Non-Functional Requirements:
      - security: Password encryption, Session management
      - performance: Fast response times"
    `)
  })

  it('should handle empty requirements objects', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      businessRequirement: 'Simple system',
      functionalRequirements: {},
      nonFunctionalRequirements: {},
    }

    const result = convertRequirementsToPrompt(analyzedRequirements)

    expect(result).toMatchInlineSnapshot(`
      "Business Requirement: Simple system

      Functional Requirements:


      Non-Functional Requirements:"
    `)
  })

  it('should handle empty business requirement', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      businessRequirement: '',
      functionalRequirements: {
        basic: [{ id: '1', desc: 'feature1' }],
      },
      nonFunctionalRequirements: {
        quality: [{ id: '2', desc: 'reliable' }],
      },
    }

    const result = convertRequirementsToPrompt(analyzedRequirements)

    expect(result).toMatchInlineSnapshot(`
      "Business Requirement: 

      Functional Requirements:
      - basic: feature1

      Non-Functional Requirements:
      - quality: reliable"
    `)
  })

  describe('with schemaIssues filtering', () => {
    it('should filter requirements based on schemaIssues without showing issue details', () => {
      const schemaIssues = [
        { requirementId: '2', description: 'Missing logout table' },
        { requirementId: '7', description: 'Encryption field missing' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      expect(result).toMatchInlineSnapshot(`
        "Business Requirement: Build a user management system

        Functional Requirements:
        - authentication: Logout

        Non-Functional Requirements:
        - security: Password encryption"
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
        "Business Requirement: Build a user management system

        Functional Requirements:
        - authentication: Login, Logout, Password reset
        - userManagement: Create user, Update user, Delete user

        Non-Functional Requirements:
        - security: Password encryption, Session management
        - performance: Fast response times"
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
        "Business Requirement: Build a user management system

        Functional Requirements:
        - authentication: Login

        Non-Functional Requirements:"
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
        "Business Requirement: Build a user management system

        Functional Requirements:


        Non-Functional Requirements:"
      `)
    })

    it('should filter requirements without showing IDs or issue details', () => {
      const schemaIssues = [
        { requirementId: '4', description: 'User table structure issue' },
        { requirementId: '9', description: 'Performance index missing' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        schemaIssues,
      )

      expect(result).toContain('Create user')
      expect(result).toContain('Fast response times')
      expect(result).not.toContain('[4]')
      expect(result).not.toContain('[9]')
      expect(result).not.toContain('User table structure issue')
      expect(result).not.toContain('Performance index missing')
    })
  })
})
