import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type { WorkflowState } from '../../chat/workflow/types'
import { generateDdlFromSchema } from '../../chat/workflow/utils/generateDdl'
import { logAssistantMessage } from '../../chat/workflow/utils/timelineLogger'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import type { Testcase } from '../generateTestcase/agent'
import { DMLGenerationAgent } from './agent'

/**
 * Format test cases into a structured string for DML generation
 */
function formatTestCases(testCases: Testcase[]): string {
  // Group test cases by requirement category
  const groupedTestCases = testCases.reduce<Record<string, Testcase[]>>(
    (acc, tc) => {
      const category = tc.requirementCategory?.trim() || 'General'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(tc)
      return acc
    },
    {},
  )

  // Format grouped test cases with UUIDs
  const formattedGroups = Object.entries(groupedTestCases).map(
    ([category, cases]) => {
      const formattedCases = cases
        .map(
          (tc) =>
            `  - ID: ${tc.id} | ${tc.title}: ${tc.description}${
              tc.requirement ? ` (Requirement: ${tc.requirement})` : ''
            }`,
        )
        .join('\n')
      return `${category}:\n${formattedCases}`
    },
  )

  return formattedGroups.join('\n\n')
}

/**
 * Prepare DML Node - Generates DML statements based on schema and use cases
 * Performed by DMLGenerationAgent
 */
export async function prepareDmlNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'db'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'prepareDmlNode',
    )
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Creating sample data to test your database design...',
    assistantRole,
  )

  const ddlStatements = generateDdlFromSchema(state.schemaData)
  if (!ddlStatements) {
    await logAssistantMessage(
      state,
      repositories,
      'Database structure not ready yet. Cannot create sample data without the schema...',
      assistantRole,
    )
    return state
  }

  if (!state.generatedTestcases || state.generatedTestcases.length === 0) {
    await logAssistantMessage(
      state,
      repositories,
      'Test scenarios not available. Cannot create sample data without test cases...',
      assistantRole,
    )
    return state
  }

  const dmlAgent = new DMLGenerationAgent()

  const formattedTestCases = formatTestCases(state.generatedTestcases)

  const schemaContext = convertSchemaToText(state.schemaData)

  const result = await dmlAgent.generate({
    schemaSQL: ddlStatements,
    formattedTestCases,
    schemaContext,
  })

  if (!result.dmlOperations || result.dmlOperations.length === 0) {
    await logAssistantMessage(
      state,
      repositories,
      'No sample data could be generated for your database design...',
      assistantRole,
    )
    return state
  }

  const dmlStatements = result.dmlOperations
    .map((op) => {
      const header = op.description
        ? `-- ${op.description}`
        : `-- ${op.operation_type} operation for test case ${op.testCaseId}`
      return `${header}\n${op.sql};`
    })
    .join('\n\n')

  const updatedTestcases = state.generatedTestcases.map((testcase) => {
    const testcaseDmlOperations = result.dmlOperations.filter(
      (op) => op.testCaseId === testcase.id,
    )
    return {
      ...testcase,
      dmlOperations: testcaseDmlOperations,
    }
  })

  return {
    ...state,
    dmlStatements,
    generatedTestcases: updatedTestcases,
  }
}
