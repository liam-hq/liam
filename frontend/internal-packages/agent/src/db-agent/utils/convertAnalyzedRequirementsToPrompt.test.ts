import { describe, expect, it } from 'vitest'
import type { AnalyzedRequirements } from '../../schemas/analyzedRequirements'
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
    const userInput = 'Design a user management system with authentication'
    const result = convertRequirementsToPrompt(
      sampleAnalyzedRequirements,
      userInput,
    )

    expect(result).toMatchInlineSnapshot(`
      "## Session Goal

      Build a user management system

      ## Original User Request

      Design a user management system with authentication

      ## Requirements

      - authentication: User login (SELECT), User logout (UPDATE), Password reset (UPDATE)
      - userManagement: Create new user (INSERT), Update user info (UPDATE), Delete user (DELETE)"
    `)
  })

  it('should handle empty testcases objects', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Simple system',
      testcases: {},
    }
    const userInput = 'Build a simple system'

    const result = convertRequirementsToPrompt(analyzedRequirements, userInput)

    expect(result).toMatchInlineSnapshot(`
      "## Session Goal

      Simple system

      ## Original User Request

      Build a simple system

      ## Requirements"
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
    const userInput = 'Add a basic feature'

    const result = convertRequirementsToPrompt(analyzedRequirements, userInput)

    expect(result).toMatchInlineSnapshot(`
      "## Session Goal



      ## Original User Request

      Add a basic feature

      ## Requirements

      - basic: Basic feature test (INSERT)"
    `)
  })

  describe('with schemaIssues filtering', () => {
    it('should filter testcases based on schemaIssues without showing issue details', () => {
      const userInput = 'Design a user management system with authentication'
      const schemaIssues = [
        { testcaseId: '2', description: 'Missing logout table' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        userInput,
        schemaIssues,
      )

      expect(result).toMatchInlineSnapshot(`
        "## Session Goal

        Build a user management system

        ## Original User Request

        Design a user management system with authentication

        ## Requirements

        - authentication: User logout (UPDATE)

        ## Schema Issues to Fix

        1. Missing logout table"
      `)
    })

    it('should handle empty schemaIssues array', () => {
      const userInput = 'Design a user management system with authentication'
      const schemaIssues: Array<{
        testcaseId: string
        description: string
      }> = []

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        userInput,
        schemaIssues,
      )

      // Should behave like no schemaIssues parameter
      expect(result).toMatchInlineSnapshot(`
        "## Session Goal

        Build a user management system

        ## Original User Request

        Design a user management system with authentication

        ## Requirements

        - authentication: User login (SELECT), User logout (UPDATE), Password reset (UPDATE)
        - userManagement: Create new user (INSERT), Update user info (UPDATE), Delete user (DELETE)"
      `)
    })

    it('should filter out entire categories when no testcases match schemaIssues', () => {
      const userInput = 'Design a user management system with authentication'
      const schemaIssues = [
        { testcaseId: '1', description: 'Login form missing' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        userInput,
        schemaIssues,
      )

      expect(result).toMatchInlineSnapshot(`
        "## Session Goal

        Build a user management system

        ## Original User Request

        Design a user management system with authentication

        ## Requirements

        - authentication: User login (SELECT)

        ## Schema Issues to Fix

        1. Login form missing"
      `)
    })

    it('should handle schemaIssues with no matching testcases', () => {
      const userInput = 'Design a user management system with authentication'
      const schemaIssues = [
        {
          testcaseId: 'non-existent',
          description: 'Non-existent testcase issue',
        },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        userInput,
        schemaIssues,
      )

      expect(result).toMatchInlineSnapshot(`
        "## Session Goal

        Build a user management system

        ## Original User Request

        Design a user management system with authentication

        ## Requirements



        ## Schema Issues to Fix

        1. Non-existent testcase issue"
      `)
    })

    it('should filter testcases and show issue details in Schema Issues section', () => {
      const userInput = 'Design a user management system with authentication'
      const schemaIssues = [
        { testcaseId: '4', description: 'User table structure issue' },
      ]

      const result = convertRequirementsToPrompt(
        sampleAnalyzedRequirements,
        userInput,
        schemaIssues,
      )

      expect(result).toContain('## Original User Request')
      expect(result).toContain(
        'Design a user management system with authentication',
      )
      expect(result).toContain('Create new user')
      expect(result).not.toContain('[4]')
      expect(result).toContain('## Schema Issues to Fix')
      expect(result).toContain('User table structure issue')
    })
  })
})
