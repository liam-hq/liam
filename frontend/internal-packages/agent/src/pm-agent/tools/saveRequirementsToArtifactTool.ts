import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import type {
  Artifact,
  FunctionalRequirement,
  NonFunctionalRequirement,
} from '@liam-hq/artifact'
import { fromValibotSafeParse } from '@liam-hq/neverthrow'
import { err, ok, type Result } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { SSE_EVENTS } from '../../client'
import type { Repositories } from '../../repositories'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { getConfigurable } from '../../utils/getConfigurable'
import { toJsonSchema } from '../../utils/jsonSchema'

// Valibot schema for validating analyzedRequirements structure
const analyzedRequirementsSchema = v.object({
  businessRequirement: v.string(),
  functionalRequirements: v.record(v.string(), v.array(v.string())),
  nonFunctionalRequirements: v.record(v.string(), v.array(v.string())),
})

type AnalyzedRequirements = v.InferOutput<typeof analyzedRequirementsSchema>

const toolSchema = toJsonSchema(analyzedRequirementsSchema)

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
 */
const createArtifactFromRequirements = (
  analyzedRequirements: AnalyzedRequirements,
): Artifact => {
  const requirements: (FunctionalRequirement | NonFunctionalRequirement)[] = []

  for (const [category, items] of Object.entries(
    analyzedRequirements.functionalRequirements,
  )) {
    const functionalRequirement: FunctionalRequirement = {
      type: 'functional',
      name: category,
      description: items,
      test_cases: [], // Empty array as test cases don't exist at this point
    }
    requirements.push(functionalRequirement)
  }

  for (const [category, items] of Object.entries(
    analyzedRequirements.nonFunctionalRequirements,
  )) {
    const nonFunctionalRequirement: NonFunctionalRequirement = {
      type: 'non_functional',
      name: category,
      description: items,
    }
    requirements.push(nonFunctionalRequirement)
  }

  return {
    requirement_analysis: {
      business_requirement: analyzedRequirements.businessRequirement,
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
    const analyzedRequirements = v.parse(analyzedRequirementsSchema, input)

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
      },
    })
  },
  {
    name: 'saveRequirementsToArtifactTool',
    description:
      'Save the analyzed requirements to the database as an artifact. Accepts business requirements, functional requirements, and non-functional requirements.',
    schema: toolSchema,
  },
)
