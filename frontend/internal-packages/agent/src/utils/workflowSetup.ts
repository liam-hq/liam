import type { CompiledStateGraph } from '@langchain/langgraph'
import { END } from '@langchain/langgraph'
import { ResultAsync } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import type {
  AgentWorkflowParams,
  AgentWorkflowResult,
  WorkflowConfigurable,
  WorkflowState,
} from '../types'
import { DEFAULT_RECURSION_LIMIT } from './constants'

/**
 * Configuration for workflow setup
 */
export type WorkflowSetupConfig = {
  workflowState: WorkflowState
  workflowRunId: string
  runCollector: Record<string, unknown>
  configurable: WorkflowConfigurable
  traceEnhancement: Record<string, unknown>
}

/**
 * Result of workflow setup
 */
export type WorkflowSetupResult = {
  workflowState: WorkflowState
  workflowRunId: string
  runCollector: Record<string, unknown>
  configurable: WorkflowConfigurable
  traceEnhancement: Record<string, unknown>
}

/**
 * Setup workflow state with proper initialization
 */
export const setupWorkflowState = (
  params: AgentWorkflowParams,
  config: { configurable: WorkflowConfigurable },
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

  return ResultAsync.fromPromise(
    (async () => {
      const getUserInfo = async () => {
        return { userId, organizationId }
      }

      const createWorkflowRun = async () => {
        const workflowRunId = uuidv4()
        const runCollector = {
          collect: () => {},
        }
        return { workflowRunId, runCollector }
      }

      const [userInfo, workflowRun] = await Promise.all([
        getUserInfo(),
        createWorkflowRun(),
      ])

      const traceEnhancement = {
        userId: userInfo.userId,
        organizationId: userInfo.organizationId,
        designSessionId,
        workflowRunId: workflowRun.workflowRunId,
        userInput,
        schemaData,
        buildingSchemaId,
        latestVersionNumber,
      }

      const workflowState: WorkflowState = {
        messages: [],
        userInput,
        schemaData,
        testcases: [],
        buildingSchemaId,
        latestVersionNumber,
        organizationId: userInfo.organizationId,
        userId: userInfo.userId,
        designSessionId,
        next: END,
      }

      return {
        workflowState,
        workflowRunId: workflowRun.workflowRunId,
        runCollector: workflowRun.runCollector,
        configurable: config.configurable,
        traceEnhancement,
      }
    })(),
    (error) => new Error(`Failed to setup workflow state: ${error}`),
  )
}

/**
 * Execute workflow with tracking and error handling
 */
export const executeWorkflowWithTracking = (
  compiled: CompiledStateGraph<any, any, any, any>,
  setupResult: WorkflowSetupResult,
  recursionLimit: number = DEFAULT_RECURSION_LIMIT,
): AgentWorkflowResult => {
  const { workflowState, configurable } = setupResult

  const isWorkflowState = (state: any): state is WorkflowState => {
    return state && typeof state === 'object' && 'messages' in state
  }

  const executeWorkflow = async (): Promise<WorkflowState> => {
    const result = await compiled.invoke(workflowState, {
      configurable,
      recursionLimit,
    })

    if (!isWorkflowState(result)) {
      return Promise.reject(new Error('Invalid workflow result'))
    }

    return result
  }

  return ResultAsync.fromPromise(executeWorkflow(), (error) =>
    error instanceof Error ? error : new Error(String(error)),
  )
}
