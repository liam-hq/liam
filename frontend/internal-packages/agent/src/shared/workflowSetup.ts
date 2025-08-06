import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import type { CompiledStateGraph } from '@langchain/langgraph'
import { err, ok, ResultAsync } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_RECURSION_LIMIT } from '../chat/workflow/shared/langGraphUtils'
import type {
  WorkflowConfigurable,
  WorkflowState,
} from '../chat/workflow/types'
import { withTimelineItemSync } from '../chat/workflow/utils/withTimelineItemSync'
import { isSchemaRepositoryWithCheckpointerFactory } from '../repositories/types'
import type { AgentWorkflowParams, AgentWorkflowResult } from '../types'
import { WorkflowTerminationError } from './errorHandling'

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
  checkpointer?: BaseCheckpointSaver
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
      
      // Initialize checkpointer with organizationId
      let checkpointer: BaseCheckpointSaver
      
      // For SupabaseSchemaRepository, initialize the checkpointer
      if (isSchemaRepositoryWithCheckpointerFactory(repositories.schema)) {
        checkpointer = repositories.schema.createCheckpointer(organizationId)
      } else {
        // For other repositories (like InMemoryRepository), use the existing checkpointer
        checkpointer = repositories.schema.checkpointer
      }
      
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
        checkpointer,
        configurable: {
          repositories,
          buildingSchemaId,
          latestVersionNumber,
          // Add thread_id for checkpoint functionality
          thread_id: designSessionId,
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

  // Type guard for safe type checking
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
      ? ok(ok(result))
      : err(new Error('Invalid workflow result'))

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

  const handleWorkflowTermination = (error: WorkflowTerminationError) =>
    ResultAsync.combine([
      saveTimelineItem(error),
      updateWorkflowStatus('error'),
    ]).map(() => ok(workflowState))

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
