import type {
  Artifact,
  FunctionalRequirement,
  NonFunctionalRequirement,
} from '@liam-hq/artifact'

/**
 * Convert Artifact data structure to Markdown format
 */
export const formatArtifactToMarkdown = (artifact: Artifact): string => {
  const { requirement_analysis } = artifact
  const { business_requirement, requirements } = requirement_analysis

  const sections: string[] = []

  // Business Requirement section
  sections.push('# Business Requirement')
  sections.push('')
  sections.push(business_requirement)
  sections.push('')

  // Requirements section
  if (requirements.length > 0) {
    sections.push('## Requirements')
    sections.push('')

    // Group requirements by type
    const functionalReqs = requirements.filter(
      (req) => req.type === 'functional',
    ) as FunctionalRequirement[]
    const nonFunctionalReqs = requirements.filter(
      (req) => req.type === 'non_functional',
    ) as NonFunctionalRequirement[]

    // Functional Requirements
    if (functionalReqs.length > 0) {
      sections.push('### Functional Requirements')
      sections.push('')

      functionalReqs.forEach((req, index) => {
        sections.push(`#### ${index + 1}. ${req.name}`)
        sections.push('')
        sections.push(req.description)
        sections.push('')

        // Use cases
        if (req.use_cases.length > 0) {
          sections.push('**Use Cases:**')
          sections.push('')

          req.use_cases.forEach((useCase, ucIndex) => {
            sections.push(`${ucIndex + 1}. **${useCase.title}**`)
            sections.push(`   - ${useCase.description}`)

            // DML Operations (if any)
            if (useCase.dml_operations.length > 0) {
              sections.push('   - **DML Operations:**')
              useCase.dml_operations.forEach((dml, dmlIndex) => {
                sections.push(`     ${dmlIndex + 1}. ${dml.operation_type}`)
                sections.push('        ```sql')
                sections.push(`        ${dml.sql}`)
                sections.push('        ```')

                // Execution logs (if any)
                if (dml.dml_execution_logs.length > 0) {
                  sections.push('        **Execution Logs:**')
                  dml.dml_execution_logs.forEach((log) => {
                    const status = log.success ? '✅ Success' : '❌ Failed'
                    sections.push(
                      `        - ${new Date(log.executed_at).toLocaleString()}: ${status} - ${log.result_summary}`,
                    )
                  })
                }
              })
            }
          })
          sections.push('')
        }
      })
    }

    // Non-Functional Requirements
    if (nonFunctionalReqs.length > 0) {
      sections.push('### Non-Functional Requirements')
      sections.push('')

      nonFunctionalReqs.forEach((req, index) => {
        sections.push(`#### ${index + 1}. ${req.name}`)
        sections.push('')
        sections.push(req.description)
        sections.push('')
      })
    }
  }

  return sections.join('\n')
}
