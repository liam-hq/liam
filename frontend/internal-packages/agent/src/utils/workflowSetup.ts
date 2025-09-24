import { HumanMessage } from '@langchain/core/messages'
import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector'
import type { CompiledStateGraph } from '@langchain/langgraph'
import { END } from '@langchain/langgraph'
import { fromPromise } from '@liam-hq/neverthrow'
import { errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import type {
  AgentWorkflowParams,
  AgentWorkflowResult,
  WorkflowConfigurable,
  WorkflowState,
} from '../types'
import { WorkflowTerminationError } from './errorHandling'
import { createEnhancedTraceData } from './traceEnhancer'

/**
 * Parameters for setting up stream options
 */
type SetupStreamOptionsParams = {
  organizationId: string
  buildingSchemaId: string
  designSessionId: string
  userId: string
  latestVersionNumber?: number
  repositories: WorkflowConfigurable['repositories']
  thread_id: string
  recursionLimit: number
  signal: AbortSignal
}

/**
 * Stream options for workflow execution - compatible with streamEvents
 */
type StreamOptions = {
  recursionLimit: number
  configurable: WorkflowConfigurable & {
    buildingSchemaId: string
    latestVersionNumber: number
  }
  runId: string
  callbacks: RunCollectorCallbackHandler[]
  tags: string[]
  metadata: Record<string, unknown>
  streamMode: 'messages'
  version: 'v2'
  signal: AbortSignal
}

/**
 * Convert workflow parameters to properly structured workflow state
 * This includes message conversion, timeline sync, and state initialization
 */
export const setupWorkflowState = (
  params: AgentWorkflowParams,
  repositories: WorkflowConfigurable['repositories'],
): ResultAsync<WorkflowState, Error> => {
  const {
    userInput,
    schemaData,
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
    designSessionId,
    userId,
  } = params

  // Fetch user info to get userName
  const getUserInfo = fromPromise(repositories.schema.getUserInfo(userId))

  return getUserInfo.andThen((userInfo) => {
    const userName = userInfo?.userName

    const userMessage = new HumanMessage({
      content: userInput,
      additional_kwargs: {
        userName,
      },
    })
    const allMessages = [userMessage]

    return ok({
      messages: allMessages,
      schemaData,
      analyzedRequirements: {
        businessRequirement: '',
        functionalRequirements: {},
        nonFunctionalRequirements: {},
      },
      testcases: [],
      schemaIssues: [],
      organizationId,
      buildingSchemaId,
      latestVersionNumber,
      designSessionId,
      userId,
      next: END,
    })
  })
}

/**
 * Execute workflow with proper error handling and finalization
 * This wraps the workflow execution with error handling, status updates, and artifact finalization
 *
 * @param compiled - LangGraph compiled workflow that works with WorkflowState
 * @param workflowState - The prepared workflow state
 * @param streamOptions - Stream options containing run metadata and configuration
 */
export const executeWorkflowWithTracking = <
  S extends CompiledStateGraph<unknown, unknown>,
>(
  compiled: S,
  workflowState: WorkflowState,
  streamOptions: StreamOptions,
): AgentWorkflowResult => {
  const {
    recursionLimit,
    configurable,
    runId: workflowRunId,
    callbacks,
    tags,
    metadata,
  } = streamOptions

  // Type guard for safe type checking
  const isWorkflowState = (obj: unknown): obj is WorkflowState => {
    return typeof obj === 'object' && obj !== null
  }

  const executeWorkflow = ResultAsync.fromPromise(
    compiled.invoke(workflowState, {
      recursionLimit,
      configurable,
      runId: workflowRunId,
      callbacks,
      tags,
      metadata,
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

/**
 * Setup stream options for workflow execution
 * This includes run metadata, tracing, and configuration required for streaming
 */
export const setupStreamOptions = ({
  organizationId,
  buildingSchemaId,
  designSessionId,
  userId,
  latestVersionNumber = 0,
  repositories,
  thread_id,
  recursionLimit,
  signal,
}: SetupStreamOptionsParams): StreamOptions => {
  const workflowRunId = uuidv4()
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

  return {
    recursionLimit,
    configurable: {
      repositories,
      thread_id,
      buildingSchemaId,
      latestVersionNumber,
    },
    runId: workflowRunId,
    callbacks: [runCollector],
    tags: traceEnhancement.tags,
    metadata: traceEnhancement.metadata,
    streamMode: 'messages' as const,
    version: 'v2' as const,
    signal,
  }
}
