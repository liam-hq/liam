import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector'
import type { Schema } from '@liam-hq/db-structure'
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import { WORKFLOW_ERROR_MESSAGES } from './chat/workflow/constants'
import { finalizeArtifactsNode } from './chat/workflow/nodes'
import { DEFAULT_RECURSION_LIMIT } from './chat/workflow/shared/langGraphUtils'
import type { WorkflowConfigurable, WorkflowState } from './chat/workflow/types'
import { withTimelineItemSync } from './chat/workflow/utils/withTimelineItemSync'
import { createGraph } from './createGraph'

export type DeepModelingParams = {
  userInput: string
  schemaData: Schema
  history: [string, string][]
  organizationId: string
  buildingSchemaId: string
  latestVersionNumber: number
  designSessionId: string
  userId: string
  recursionLimit?: number
}

export type DeepModelingResult = Result<WorkflowState, Error>

/**
 * Execute Deep Modeling workflow
 */
export const deepModeling = async (
  params: DeepModelingParams,
  config: {
    configurable: WorkflowConfigurable
  },
): Promise<DeepModelingResult> => {
  const {
    userInput,
    schemaData,
    history,
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
    designSessionId,
    userId,
    recursionLimit = DEFAULT_RECURSION_LIMIT,
  } = params

  const { repositories } = config.configurable

  // Convert history to BaseMessage objects
  const messages = history.map(([role, content]) => {
    return role === 'assistant'
      ? new AIMessage(content)
      : new HumanMessage(content)
  })

  // Add the current user input as the latest message with timeline sync
  const humanMessage = await withTimelineItemSync(new HumanMessage(userInput), {
    designSessionId,
    organizationId: organizationId || '',
    userId,
    repositories,
  })
  messages.push(humanMessage)

  // Create workflow state
  const workflowState: WorkflowState = {
    userInput: userInput,
    messages,
    schemaData,
    organizationId,
    buildingSchemaId,
    latestVersionNumber,
    designSessionId,
    userId,
    retryCount: {},
  }

  const workflowRunId = uuidv4()

  try {
    const createWorkflowRunResult = await repositories.schema.createWorkflowRun(
      {
        designSessionId,
        workflowRunId,
      },
    )

    if (!createWorkflowRunResult.success) {
      return err(
        new Error(
          `Failed to create workflow run record: ${createWorkflowRunResult.error}`,
        ),
      )
    }

    const compiled = createGraph()
    const runCollector = new RunCollectorCallbackHandler()
    const result = await compiled.invoke(workflowState, {
      recursionLimit,
      configurable: {
        repositories,
        buildingSchemaId,
        latestVersionNumber,
      },
      runId: workflowRunId,
      callbacks: [runCollector],
    })

    if (result.error) {
      await repositories.schema.updateWorkflowRunStatus({
        workflowRunId,
        status: 'error',
      })
      return err(new Error(result.error.message))
    }

    await repositories.schema.updateWorkflowRunStatus({
      workflowRunId,
      status: 'success',
    })

    return ok(result)
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED

    await repositories.schema.updateWorkflowRunStatus({
      workflowRunId,
      status: 'error',
    })

    const errorState = { ...workflowState, error: new Error(errorMessage) }
    const finalizedResult = await finalizeArtifactsNode(errorState, {
      configurable: {
        repositories,
      },
    })

    return err(new Error(finalizedResult.error?.message || errorMessage))
  }
}
