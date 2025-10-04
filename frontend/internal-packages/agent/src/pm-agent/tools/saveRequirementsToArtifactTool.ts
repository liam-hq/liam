import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import type { Artifact } from '@liam-hq/artifact'
import { fromValibotSafeParse } from '@liam-hq/neverthrow'
import { err, ok, type Result } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import type { Repositories } from '../../repositories'
import { SSE_EVENTS } from '../../streaming/constants'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { getConfigurable } from '../../utils/getConfigurable'
import { toJsonSchema } from '../../utils/jsonSchema'
import {
  type AnalyzedRequirements,
  testCaseSchema,
} from '../../utils/schema/analyzedRequirements'

const testCaseInputSchema = v.omit(testCaseSchema, ['id', 'sql', 'testResults'])

const analyzedRequirementsInputSchema = v.object({
  goal: v.string(),
  testcases: v.record(v.string(), v.array(testCaseInputSchema)),
})

const toolSchema = toJsonSchema(analyzedRequirementsInputSchema)

const configSchema = v.object({
  toolCall: v.object({
    id: v.string(),
  }),
  configurable: v.object({
    designSessionId: v.string(),
  }),
})

type ToolConfigurable = {
  repositories: Repositories
  designSessionId: string
  toolCallId: string
}

/**
 * Create an Artifact from analyzed requirements
 * @param analyzedRequirements - Validated analyzed requirements object
 * @returns Artifact object ready to be saved
 *
 * TODO: Remove this conversion function in the future.
 * Plan to deprecate the Artifact type definition in artifact.ts and use
 * AnalyzedRequirements structure directly as the Artifact.
 * This will eliminate the need for this transformation between similar structures.
 */
const createArtifactFromRequirements = (
  analyzedRequirements: AnalyzedRequirements,
): Artifact => {
  const requirements: Artifact['requirement_analysis']['requirements'] = []

  for (const [category, testcases] of Object.entries(
    analyzedRequirements.testcases,
  )) {
    const testCases: Artifact['requirement_analysis']['requirements'][number]['test_cases'] =
      testcases.map((tc) => ({
        title: tc.title,
        description: `Test for ${tc.type} operation`,
        dmlOperation: {
          operation_type: tc.type,
          sql: tc.sql,
          description: tc.title,
          dml_execution_logs: [],
        },
      }))

    const requirement: Artifact['requirement_analysis']['requirements'][number] =
      {
        name: category,
        description: [analyzedRequirements.goal],
        test_cases: testCases,
      }
    requirements.push(requirement)
  }

  return {
    requirement_analysis: {
      business_requirement: analyzedRequirements.goal,
      requirements,
    },
  }
}

const getToolConfigurable = (
  config: RunnableConfig,
): Result<ToolConfigurable, Error> => {
  const baseConfigResult = getConfigurable(config)
  if (baseConfigResult.isErr()) {
    return err(baseConfigResult.error)
  }
  return fromValibotSafeParse(configSchema, config).andThen((value) =>
    ok({
      repositories: baseConfigResult.value.repositories,
      designSessionId: value.configurable.designSessionId,
      toolCallId: value.toolCall.id,
    }),
  )
}

/**
 * Tool for saving analyzed requirements to artifact and updating workflow state
 */
export const saveRequirementsToArtifactTool: StructuredTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<Command> => {
    // Parse input and add id, sql, testResults to each testcase
    const inputData = v.parse(analyzedRequirementsInputSchema, input)
    const analyzedRequirements: AnalyzedRequirements = {
      goal: inputData.goal,
      testcases: Object.fromEntries(
        Object.entries(inputData.testcases).map(([category, testcases]) => [
          category,
          testcases.map((tc) => ({
            id: uuidv4(),
            title: tc.title,
            type: tc.type,
            sql: '',
            testResults: [],
          })),
        ]),
      ),
    }

    const toolConfigurableResult = getToolConfigurable(config)
    if (toolConfigurableResult.isErr()) {
      throw new WorkflowTerminationError(
        toolConfigurableResult.error,
        'saveRequirementsToArtifactTool',
      )
    }

    const { repositories, designSessionId, toolCallId } =
      toolConfigurableResult.value

    const artifact = createArtifactFromRequirements(analyzedRequirements)

    const result = await repositories.schema.upsertArtifact({
      designSessionId,
      artifact,
    })

    if (result.isErr()) {
      // LangGraph tool nodes require throwing errors to trigger retry mechanism
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(
        `Failed to save artifact: ${result.error.message}. Please try again or contact support if the issue persists.`,
      )
    }

    const toolMessage = new ToolMessage({
      id: uuidv4(),
      status: 'success',
      content: 'Requirements saved successfully to artifact',
      tool_call_id: toolCallId,
    })
    await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)

    return new Command({
      update: {
        analyzedRequirements,
        messages: [toolMessage],
        artifactSaveSuccessful: true,
      },
    })
  },
  {
    name: 'saveRequirementsToArtifactTool',
    description:
      'Save the analyzed requirements to the database as an artifact. Accepts business requirements and functional requirements.',
    schema: toolSchema,
  },
)
