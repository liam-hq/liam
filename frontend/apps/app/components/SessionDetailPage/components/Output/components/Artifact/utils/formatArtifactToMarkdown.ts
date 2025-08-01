import type { Artifact, DmlOperation, UseCase } from '@liam-hq/artifact'

function formatDmlOperation(operation: DmlOperation): string {
  const sections: string[] = []

  // Operation type and description
  if (operation.description) {
    sections.push(`**${operation.operation_type}** - ${operation.description}`)
  } else {
    sections.push(`**${operation.operation_type}**`)
  }
  sections.push('')

  // SQL code block
  sections.push('```sql')
  sections.push(operation.sql.trim())
  sections.push('```')

  // Execution logs
  if (operation.dml_execution_logs.length > 0) {
    sections.push('')
    sections.push('**Execution History:**')
    sections.push('')

    operation.dml_execution_logs.forEach((log) => {
      const statusIcon = log.success ? '✅' : '❌'
      const executedAt = new Date(log.executed_at).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      sections.push(`${statusIcon} **${executedAt}**`)
      sections.push(`> ${log.result_summary}`)
      sections.push('')
    })
  }

  return sections.join('\n')
}

function formatUseCase(useCase: UseCase, index: number): string {
  const sections: string[] = []

  sections.push(`#### ${index + 1}. ${useCase.title}`)
  sections.push('')
  sections.push(useCase.description)

  if (useCase.dml_operations.length > 0) {
    sections.push('')
    sections.push('**Related DML Operations:**')
    sections.push('')

    useCase.dml_operations.forEach((operation, opIndex) => {
      if (useCase.dml_operations.length > 1) {
        sections.push(`##### Operation ${opIndex + 1}`)
        sections.push('')
      }
      sections.push(formatDmlOperation(operation))

      if (opIndex < useCase.dml_operations.length - 1) {
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
      sections.push(req.description)

      if (req.type === 'functional' && req.use_cases.length > 0) {
        sections.push('')
        sections.push('**Use Cases:**')
        sections.push('')

        req.use_cases.forEach((useCase, ucIndex) => {
          sections.push(formatUseCase(useCase, ucIndex))
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
      sections.push(req.description)

      if (reqIndex < nonFunctionalReqs.length - 1) {
        sections.push('')
        sections.push('---')
        sections.push('')
      }
    })
  }

  return sections.join('\n')
}
