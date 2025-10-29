import { HumanMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector'
import { END } from '@langchain/langgraph'
import { errAsync, ok, okAsync, ResultAsync } from '@liam-hq/neverthrow'
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
type WorkflowSetupConfig = {
  configurable: WorkflowConfigurable
}

/**
 * Result of workflow setup, containing the prepared state and run metadata
 */
type WorkflowSetupResult = {
  workflowState: WorkflowState
  runCollector: RunCollectorCallbackHandler
  configurable: WorkflowConfigurable
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
  const { userInput, schemaData, organizationId, designSessionId, userId } =
    params

  const { repositories, thread_id } = config.configurable

  // Fetch user info to get userName
  const getUserInfo = ResultAsync.fromPromise(
    repositories.schema.getUserInfo(userId),
    (error) => new Error(String(error)),
  )

  return getUserInfo.andThen((userInfo) => {
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
      'agent-workflow',
      [`organization:${organizationId}`, `session:${designSessionId}`],
      {
        workflow: {
          design_session_id: designSessionId,
          user_id: userId,
          organization_id: organizationId,
        },
      },
    )

    return ok({
      workflowState: {
        messages: allMessages,
        schemaData,
        analyzedRequirements: {
          goal: '',
          testcases: {},
        },
        schemaIssues: [],
        organizationId,
        designSessionId,
        userId,
        next: END,
      },
      runCollector,
      configurable: {
        repositories,
        thread_id,
      },
      traceEnhancement,
    })
  })
}

/**
 * Execute workflow with proper error handling and finalization
 * This wraps the workflow execution with error handling, status updates, and artifact finalization
 *
 * @param compiled - LangGraph compiled workflow that works with WorkflowState
 * @param setupResult - Workflow setup result containing state and configuration
 * @param recursionLimit - Maximum number of recursive calls allowed
 */
type InvokableGraph = {
  invoke(input: WorkflowState, config?: RunnableConfig): Promise<unknown>
}

export const executeWorkflowWithTracking = (
  compiled: InvokableGraph,
  setupResult: WorkflowSetupResult,
  recursionLimit: number = DEFAULT_RECURSION_LIMIT,
): AgentWorkflowResult => {
  const { workflowState, runCollector, configurable, traceEnhancement } =
    setupResult

  // Type guard for safe type checking
  const isWorkflowState = (obj: unknown): obj is WorkflowState => {
    return typeof obj === 'object' && obj !== null
  }

  const executeWorkflow = ResultAsync.fromPromise(
    compiled.invoke(workflowState, {
      recursionLimit,
      configurable,
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

  const validateAndReturnResult = (result: unknown) =>
    isWorkflowState(result)
      ? okAsync(result)
      : errAsync(new Error('Invalid workflow result'))

  return executeWorkflow.andThen(validateAndReturnResult)
}
