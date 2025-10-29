import type { ToolName } from '@liam-hq/agent/client'

type ToolDisplayInfo = {
  displayName: string
  description: string
  resultAction?: {
    label: string
    type: 'erd' | 'artifact' | 'testcases'
  }
}

export const getToolDisplayInfo = (toolName: ToolName): ToolDisplayInfo => {
  switch (toolName) {
    case 'createMigrationTool':
      return {
        displayName: 'Database Schema Design',
        description: 'Applying database schema changes',
        resultAction: {
          label: 'View ERD',
          type: 'erd',
        },
      }
    case 'processAnalyzedRequirementsTool':
      return {
        displayName: 'Process Requirements',
        description:
          'Processing and streaming business and functional requirements',
        resultAction: {
          label: 'View Artifact',
          type: 'artifact',
        },
      }
    case 'saveTestcase':
      return {
        displayName: 'Save Test Case',
        description: 'Saving a single test case with DML operation',
        resultAction: {
          label: 'View Test Case',
          type: 'testcases',
        },
      }
    case 'runTestTool':
      return {
        displayName: 'Run Test Cases',
        description: 'Executing all test cases and validating results',
        resultAction: {
          label: 'View Test Results',
          type: 'testcases',
        },
      }
  }
}
