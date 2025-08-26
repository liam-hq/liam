import type { Artifact, TestCase } from '@liam-hq/artifact'
import { EXECUTION_SECTION_TITLE, FAILURE_ICON, SUCCESS_ICON } from '../utils'

function formatTestCase(
  testCase: TestCase,
  index: number,
  reqIndex: number,
): string {
  const sections: string[] = []

  sections.push(`#### ${reqIndex + 1}.${index + 1}. ${testCase.title}`)
  sections.push('')
  sections.push(testCase.description)

  if (testCase.dml_operations.length > 0) {
    sections.push('')

    // Format all operations directly as headings
    testCase.dml_operations.forEach((operation, opIndex) => {
      // Format as heading with operation type and description
      if (operation.description) {
        sections.push(
          `##### **${operation.operation_type}** - ${operation.description}`,
        )
      } else {
        sections.push(`##### **${operation.operation_type}**`)
      }
      sections.push('')

      // SQL code block
      sections.push('```sql')
      sections.push(operation.sql.trim())
      sections.push('```')

      // Execution logs
      if (operation.dml_execution_logs.length > 0) {
        sections.push('')
        sections.push(`**${EXECUTION_SECTION_TITLE}:**`)
        sections.push('')

        operation.dml_execution_logs.forEach((log) => {
          const statusIcon = log.success ? SUCCESS_ICON : FAILURE_ICON
          const executedAt = new Date(log.executed_at).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC',
          })

          sections.push(`${statusIcon} **${executedAt}**`)
          sections.push(`> ${log.result_summary}`)
          sections.push('')
        })
      }

      if (opIndex < testCase.dml_operations.length - 1) {
        sections.push('---')
        sections.push('')
      }
    })
  }

  return sections.join('\n')
}

export function formatArtifactToMarkdown(artifact: Artifact): string {
  const { requirement_analysis } = artifact
  const { business_requirement, requirements } = requirement_analysis

  const sections: string[] = []

  // Header
  sections.push('# Requirements Document')
  sections.push('')
  sections.push(
    'This document outlines system requirements and their associated data manipulation language (DML) operations.',
  )
  sections.push('')
  sections.push('---')
  sections.push('')

  // Business requirement
  sections.push('## 📋 Business Requirements')
  sections.push('')
  sections.push(business_requirement)
  sections.push('')

  // Functional requirements
  const functionalReqs = requirements.filter((req) => req.type === 'functional')
  if (functionalReqs.length > 0) {
    sections.push('## 🔧 Functional Requirements')
    sections.push('')

    functionalReqs.forEach((req, reqIndex) => {
      sections.push(`### ${reqIndex + 1}. ${req.name}`)
      sections.push('')

      req.description.forEach((item) => {
        sections.push(`- ${item}`)
      })
      sections.push('')

      if (req.type === 'functional' && req.test_cases.length > 0) {
        sections.push('')
        sections.push('**Test Cases:**')
        sections.push('')

        req.test_cases.forEach((testCase, tcIndex) => {
          sections.push(formatTestCase(testCase, tcIndex, reqIndex))
          sections.push('')
        })
      }

      if (reqIndex < functionalReqs.length - 1) {
        sections.push('---')
        sections.push('')
      }
    })
  }

  // Non-functional requirements
  const nonFunctionalReqs = requirements.filter(
    (req) => req.type === 'non_functional',
  )
  if (nonFunctionalReqs.length > 0) {
    sections.push('')
    sections.push('## 📊 Non-Functional Requirements')
    sections.push('')

    nonFunctionalReqs.forEach((req, reqIndex) => {
      sections.push(`### ${reqIndex + 1}. ${req.name}`)
      sections.push('')

      req.description.forEach((item) => {
        sections.push(`- ${item}`)
      })
      sections.push('')

      if (reqIndex < nonFunctionalReqs.length - 1) {
        sections.push('')
        sections.push('---')
        sections.push('')
      }
    })
  }

  return sections.join('\n')
}
