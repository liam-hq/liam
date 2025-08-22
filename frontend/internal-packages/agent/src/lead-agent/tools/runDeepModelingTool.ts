import { HumanMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { tool } from '@langchain/core/tools'
import type { JSONSchema } from '@langchain/core/utils/json_schema'
import { Command } from '@langchain/langgraph'
import { toJsonSchema } from '@valibot/to-json-schema'
import { err, ok, type Result } from 'neverthrow'
import * as v from 'valibot'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type {
  WorkflowConfigurable,
  WorkflowState,
} from '../../chat/workflow/types'
import { createGraph } from '../../createGraph'
import { WorkflowTerminationError } from '../../shared/errorHandling'

const runDeepModelingSchema = v.object({
  prompt: v.string(),
})

// toJsonSchema returns a JSONSchema7, which is not assignable to JSONSchema
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const toolSchema = toJsonSchema(runDeepModelingSchema) as JSONSchema

type ToolConfigurable = WorkflowConfigurable & {
  state: WorkflowState
}

const getToolConfig = (
  config: RunnableConfig,
): Result<ToolConfigurable, Error> => {
  if (!config.configurable) {
    return err(new Error('Missing configurable object in RunnableConfig'))
  }

  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return err(new Error(configurableResult.error.message))
  }

  const { state } = config.configurable

  if (!state) {
    return err(new Error('Missing state in configurable object'))
  }

  return ok({
    ...configurableResult.value,
    state,
  })
}

export const runDeepModelingTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<Command> => {
    const parsed = v.parse(runDeepModelingSchema, input)

    const toolConfigResult = getToolConfig(config)
    if (toolConfigResult.isErr()) {
      throw new WorkflowTerminationError(
        toolConfigResult.error,
        'runDeepModelingTool',
      )
    }

    const { repositories, state } = toolConfigResult.value
    const checkpointer = repositories.schema.checkpointer

    const graph = createGraph(checkpointer)
    const modifiedState = {
      ...state,
      messages: [new HumanMessage(parsed.prompt)],
    }
    const updatedState = await graph.invoke(modifiedState, config)

    return new Command({
      update: updatedState,
    })
  },
  {
    name: 'runDeepModeling',
    description: `Execute the database design workflow (PM → DB → QA agents) when the user request involves:
    - Creating or designing database tables/schemas
    - Converting business requirements to database design
    - Generating ER diagrams or data models
    - Improving or refactoring existing database schemas
    - Defining relationships between entities
    - Database normalization or optimization requests`,
    schema: toolSchema,
  },
)
