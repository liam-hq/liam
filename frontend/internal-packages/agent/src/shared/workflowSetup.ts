import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector'
import type { CompiledStateGraph } from '@langchain/langgraph'
import { err, ok, ResultAsync } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import { finalizeArtifactsNode } from '../chat/workflow/nodes'
import { DEFAULT_RECURSION_LIMIT } from '../chat/workflow/shared/langGraphUtils'
import type {
  WorkflowConfigurable,
  WorkflowState,
} from '../chat/workflow/types'
import { withTimelineItemSync } from '../chat/workflow/utils/withTimelineItemSync'
import type { AgentWorkflowParams, AgentWorkflowResult } from '../types'

/**
 * Shared workflow setup configuration
 */
export type WorkflowSetupConfig = {
  configurable: WorkflowConfigurable
}

/**
 * Result of workflow setup, containing the prepared state and run metadata
 */
export type WorkflowSetupResult = {
  workflowState: WorkflowState
  workflowRunId: string
  runCollector: RunCollectorCallbackHandler
  configurable: WorkflowConfigurable & {
    buildingSchemaId: string
    latestVersionNumber: number
  }
}

/**
 * Convert workflow parameters to properly structured workflow state
 * This includes message conversion, timeline sync, and state initialization
 */
export const setupWorkflowState = (
  params: AgentWorkflowParams,
  config: WorkflowSetupConfig,
): ResultAsync<WorkflowSetupResult, Error> => {
  const {
    userInput,
    schemaData,
    history,
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
    designSessionId,
    userId,
  } = params

  const { repositories } = config.configurable

  // Convert history to BaseMessage objects (synchronous)
  const messages = history.map(([role, content]) => {
    return role === 'assistant'
      ? new AIMessage(content)
      : new HumanMessage(content)
  })

  const workflowRunId = uuidv4()

  const setupMessage = ResultAsync.fromPromise(
    withTimelineItemSync(new HumanMessage(userInput), {
      designSessionId,
      organizationId,
      userId,
      repositories,
    }),
    (error) => new Error(String(error)),
  ).andThen((message) => ok([...messages, message]))

  const createWorkflowRun = ResultAsync.fromPromise(
    repositories.schema.createWorkflowRun({
      designSessionId,
      workflowRunId,
    }),
    (error) => new Error(String(error)),
  ).andThen((createWorkflowRun) => {
    if (!createWorkflowRun.success) {
      return err(new Error(createWorkflowRun.error))
    }
    return ok(createWorkflowRun)
  })

  return ResultAsync.combine([setupMessage, createWorkflowRun]).andThen(
    ([messages]) => {
      const runCollector = new RunCollectorCallbackHandler()
      return ok({
        workflowState: {
          userInput: userInput,
          messages,
          schemaData,
          organizationId,
          buildingSchemaId,
          latestVersionNumber,
          designSessionId,
          userId,
          retryCount: {},
        },
        workflowRunId,
        runCollector,
        configurable: {
          repositories,
          buildingSchemaId,
          latestVersionNumber,
        },
      })
    },
  )
}

/**
 * Execute workflow with proper error handling and finalization
 * This wraps the workflow execution with error handling, status updates, and artifact finalization
 *
 * @param compiled - LangGraph compiled workflow that works with WorkflowState
 * @param setupResult - Workflow setup result containing state and configuration
 * @param recursionLimit - Maximum number of recursive calls allowed
 */
export const executeWorkflowWithTracking = <
  S extends CompiledStateGraph<unknown, unknown>,
>(
  compiled: S,
  setupResult: WorkflowSetupResult,
  recursionLimit: number = DEFAULT_RECURSION_LIMIT,
): ResultAsync<AgentWorkflowResult, Error> => {
  const { workflowState, workflowRunId, runCollector, configurable } =
    setupResult
  const { repositories } = configurable

  // Type guards for safe type checking
  const hasError = (obj: unknown): obj is { error?: Error } => {
    return typeof obj === 'object' && obj !== null && 'error' in obj
  }

  const isWorkflowState = (obj: unknown): obj is WorkflowState => {
    return typeof obj === 'object' && obj !== null
  }

  // 1. Execute the workflow
  const executeWorkflow = ResultAsync.fromPromise(
    compiled.invoke(workflowState, {
      recursionLimit,
      configurable,
      runId: workflowRunId,
      callbacks: [runCollector],
    }),
    (error) => new Error(String(error)),
  )

  // 2. Update status to error
  const updateErrorStatus = (result: { error?: Error }) =>
    ResultAsync.fromPromise(
      repositories.schema.updateWorkflowRunStatus({
        workflowRunId,
        status: 'error',
      }),
      (error) => new Error(String(error)),
    ).map(() => result)

  // 3. Finalize artifacts for error case
  const finalizeArtifacts = (result: { error?: Error }) =>
    ResultAsync.fromPromise(
      finalizeArtifactsNode(
        { ...workflowState, error: result.error },
        {
          configurable: { repositories },
        },
      ),
      (error) => new Error(String(error)),
    ).andThen((finalizedResult) =>
      err(
        new Error(
          finalizedResult.error?.message ||
            result.error?.message ||
            'Workflow execution failed',
        ),
      ),
    )

  // 4. Update status to success
  const updateSuccessStatus = (result: unknown) =>
    ResultAsync.fromPromise(
      repositories.schema.updateWorkflowRunStatus({
        workflowRunId,
        status: 'success',
      }),
      (error) => new Error(String(error)),
    ).map(() => result)

  // 5. Validate and return successful result
  const validateAndReturnResult = (result: unknown) =>
    isWorkflowState(result)
      ? ok(ok(result))
      : err(new Error('Invalid workflow result'))

  // 6. Chain everything together
  return executeWorkflow.andThen((result) => {
    if (hasError(result) && result.error) {
      return updateErrorStatus(result).andThen(finalizeArtifacts)
    }
    return updateSuccessStatus(result).andThen(validateAndReturnResult)
  })
}
