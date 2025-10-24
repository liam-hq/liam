import type { AnalyzedRequirements, TestCase } from '@liam-hq/agent/client'
import {
  FAILURE_ICON,
  SUCCESS_ICON,
  TEST_RESULTS_SECTION_TITLE,
} from '../constants'

function formatTestCase(
  testCase: TestCase,
  index: number,
  reqIndex: number,
): string {
  const sections: string[] = []

  sections.push(
    `#### ${reqIndex + 1}.${index + 1}. ${testCase.type} - ${testCase.title}`,
  )
  sections.push('')

  // SQL code block
  const sqlContent = testCase.sql.trim()
  sections.push('```sql')
  sections.push(sqlContent || '-- SQL statement not yet generated')
  sections.push('```')

  if (testCase.testResults.length > 0) {
    sections.push('')
    sections.push(`**${TEST_RESULTS_SECTION_TITLE}:**`)
    sections.push('')

    testCase.testResults.forEach((result) => {
      const statusIcon = result.success ? SUCCESS_ICON : FAILURE_ICON
      const executedAt = new Date(result.executedAt).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
      })

      sections.push(`${statusIcon} **${executedAt}**`)
      sections.push(`> ${result.message}`)
      sections.push('')
    })
  }

  return sections.join('\n')
}

export function formatArtifactToMarkdown(
  analyzedRequirements: AnalyzedRequirements,
): string {
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

  sections.push('## 📋 Goal')
  sections.push('')
  sections.push(analyzedRequirements.goal)
  sections.push('')

  const categories = Object.keys(analyzedRequirements.testcases)
  if (categories.length > 0) {
    sections.push('## 🔧 Test cases')
    sections.push('')

    categories.forEach((category, reqIndex) => {
      const testcases = analyzedRequirements.testcases[category]

      sections.push(`### ${reqIndex + 1}. ${category}`)
      sections.push('')

      if (testcases && testcases.length > 0) {
        testcases.forEach((testCase: TestCase, tcIndex: number) => {
          sections.push(formatTestCase(testCase, tcIndex, reqIndex))
          sections.push('')
        })
      }

      if (reqIndex < categories.length - 1) {
        sections.push('---')
        sections.push('')
      }
    })
  }

  return sections.join('\n')
}
