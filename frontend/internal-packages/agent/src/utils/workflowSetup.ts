import { HumanMessage } from '@langchain/core/messages'
import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector'
import type { CompiledStateGraph } from '@langchain/langgraph'
import { END } from '@langchain/langgraph'
import { err, errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_RECURSION_LIMIT } from '../constants'
import type {
  AgentWorkflowParams,
  AgentWorkflowResult,
  WorkflowConfigurable,
  WorkflowState,
} from '../types'
import { WorkflowTerminationError } from './errorHandling'
import { createEnhancedTraceData } from './traceEnhancer'

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
  traceEnhancement: {
    tags: string[]
    metadata: Record<string, unknown>
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
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
    designSessionId,
    userId,
  } = params

  const { repositories, thread_id } = config.configurable

  const workflowRunId = uuidv4()

  // Fetch user info to get userName
  const getUserInfo = ResultAsync.fromPromise(
    repositories.schema.getUserInfo(userId),
    (error) => new Error(String(error)),
  )

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

  return ResultAsync.combine([getUserInfo, createWorkflowRun]).andThen(
    ([userInfo]) => {
      const userName = userInfo?.userName

      const userMessage = new HumanMessage({
        content: userInput,
        additional_kwargs: {
          userName,
        },
      })
      const allMessages = [userMessage]

      const runCollector = new RunCollectorCallbackHandler()

      // Enhanced tracing with environment and developer context
      const traceEnhancement = createEnhancedTraceData(
        workflowRunId,
        'agent-workflow',
        [`organization:${organizationId}`, `session:${designSessionId}`],
        {
          workflow: {
            building_schema_id: buildingSchemaId,
            design_session_id: designSessionId,
            user_id: userId,
            organization_id: organizationId,
            version_number: latestVersionNumber,
          },
        },
      )

      return ok({
        workflowState: {
          userInput: userInput,
          messages: allMessages,
          schemaData,
          testcases: [],
          organizationId,
          buildingSchemaId,
          latestVersionNumber,
          designSessionId,
          userId,
          next: END,
        },
        workflowRunId,
        runCollector,
        configurable: {
          repositories,
          thread_id,
          buildingSchemaId,
          latestVersionNumber,
        },
        traceEnhancement,
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
): AgentWorkflowResult => {
  const {
    workflowState,
    workflowRunId,
    runCollector,
    configurable,
    traceEnhancement,
  } = setupResult
  const { repositories } = configurable

  // Type guard for safe type checking
  const isWorkflowState = (obj: unknown): obj is WorkflowState => {
    return typeof obj === 'object' && obj !== null
  }

  // 1. Execute the workflow with enhanced tracing
  const executeWorkflow = ResultAsync.fromPromise(
    compiled.invoke(workflowState, {
      recursionLimit,
      configurable,
      runId: workflowRunId,
      callbacks: [runCollector],
      tags: traceEnhancement.tags,
      metadata: traceEnhancement.metadata,
    }),
    (error) => {
      // WorkflowTerminationError means the workflow was intentionally terminated
      if (error instanceof WorkflowTerminationError) {
        return error
      }
      return new Error(String(error))
    },
  )

  // 2. Update workflow status
  const updateWorkflowStatus = (status: 'success' | 'error') =>
    ResultAsync.fromPromise(
      repositories.schema.updateWorkflowRunStatus({
        workflowRunId,
        status,
      }),
      (error) => new Error(String(error)),
    )

  // 3. Update status to success and validate result
  const updateSuccessStatus = (result: unknown) =>
    updateWorkflowStatus('success').map(() => result)

  const validateAndReturnResult = (result: unknown) =>
    isWorkflowState(result)
      ? okAsync(result)
      : errAsync(new Error('Invalid workflow result'))

  // 4. Handle WorkflowTerminationError - save timeline item and update status
  const saveTimelineItem = (error: WorkflowTerminationError) =>
    ResultAsync.fromPromise(
      repositories.schema.createTimelineItem({
        designSessionId: workflowState.designSessionId,
        content: error.message,
        type: 'error',
      }),
      (timelineError) => new Error(String(timelineError)),
    )

  const handleWorkflowTermination = (
    error: WorkflowTerminationError,
  ): AgentWorkflowResult =>
    ResultAsync.combine([
      saveTimelineItem(error),
      updateWorkflowStatus('error'),
    ]).map(() => workflowState)

  // 5. Chain everything together
  return executeWorkflow
    .andThen(updateSuccessStatus)
    .andThen(validateAndReturnResult)
    .orElse((error) => {
      // Handle WorkflowTerminationError - these are expected errors
      if (error instanceof WorkflowTerminationError) {
        return handleWorkflowTermination(error)
      }
      // All other errors are unexpected
      return err(error)
    })
}
