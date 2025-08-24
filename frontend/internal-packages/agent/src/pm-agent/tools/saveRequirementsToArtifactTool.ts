import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { tool } from '@langchain/core/tools'
import type { JSONSchema } from '@langchain/core/utils/json_schema'
import { Command } from '@langchain/langgraph'
import type {
  Artifact,
  FunctionalRequirement,
  NonFunctionalRequirement,
} from '@liam-hq/artifact'
import { toJsonSchema } from '@valibot/to-json-schema'
import { err, ok, type Result } from 'neverthrow'
import * as v from 'valibot'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type { Repositories } from '../../repositories'
import { WorkflowTerminationError } from '../../shared/errorHandling'

// Valibot schema for validating analyzedRequirements structure
const analyzedRequirementsSchema = v.object({
  businessRequirement: v.string(),
  functionalRequirements: v.record(v.string(), v.array(v.string())),
  nonFunctionalRequirements: v.record(v.string(), v.array(v.string())),
})

type AnalyzedRequirements = v.InferOutput<typeof analyzedRequirementsSchema>

// Convert valibot schema to LangChain JSONSchema format
// Type assertion is necessary due to incompatibility between JSONSchema7 and JSONSchema types
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const toolSchema = toJsonSchema(analyzedRequirementsSchema) as JSONSchema

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
      use_cases: [], // Empty array as use cases don't exist at this point
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
  const configParseResult = v.safeParse(configSchema, config)
  if (!configParseResult.success) {
    const errorMessage = configParseResult.issues
      .map((issue) => issue.message)
      .join(', ')
    return err(new Error(`Invalid config structure: ${errorMessage}`))
  }

  return ok({
    repositories: baseConfigResult.value.repositories,
    designSessionId: configParseResult.output.configurable.designSessionId,
    toolCallId: configParseResult.output.toolCall.id,
  })
}

/**
 * Tool for saving analyzed requirements to artifact and updating workflow state
 */
export const saveRequirementsToArtifactTool = tool(
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
      content: 'Requirements saved successfully to artifact',
      tool_call_id: toolCallId,
    })

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
