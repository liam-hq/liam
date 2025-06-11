import type { Operation } from 'fast-json-patch'
import * as v from 'valibot'
import {
  type AgentName,
  createPromptVariables,
  getAgent,
} from '../../../langchain'
import { createNewVersionBackground } from '../../../utils/createNewVersionBackground'
import { operationsSchema } from '../../../utils/operationsSchema'
import type { WorkflowState } from '../types'

interface PreparedAnswerGeneration {
  agent: ReturnType<typeof getAgent>
  agentName: AgentName
  schemaText: string
  formattedChatHistory: string
}

// Define schema for BuildAgent response validation
const buildAgentResponseSchema = v.object({
  message: v.string(),
  schemaChanges: operationsSchema,
})

type BuildAgentResponse = v.InferOutput<typeof buildAgentResponseSchema>

/**
 * Parse structured response from buildAgent using valibot for type safety
 */
const parseStructuredResponse = (
  response: string,
): BuildAgentResponse | null => {
  try {
    // Try to parse as JSON first
    const parsed: unknown = JSON.parse(response)

    // Use valibot to validate and parse the structure
    const validationResult = v.safeParse(buildAgentResponseSchema, parsed)

    if (validationResult.success) {
      return {
        message: validationResult.output.message,
        schemaChanges: validationResult.output.schemaChanges,
      }
    }

    // Log validation issues for debugging
    console.warn(
      'BuildAgent response validation failed:',
      validationResult.issues,
    )
    return null
  } catch (error) {
    // If JSON parsing fails, log the error and return null
    console.warn('Failed to parse BuildAgent response as JSON:', error)
    return null
  }
}

/**
 * Convert validated schema changes to Operation[] format
 * Using type assertion after valibot validation ensures runtime safety
 */
const convertToOperations = (
  schemaChanges: BuildAgentResponse['schemaChanges'],
): Operation[] => {
  return schemaChanges.map((change): Operation => {
    return change
  })
}

/**
 * Apply schema changes and return updated state (background version)
 */
const applySchemaChanges = async (
  schemaChanges: BuildAgentResponse['schemaChanges'],
  buildingSchemaId: string,
  latestVersionNumber: number,
  message: string,
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    const operations = convertToOperations(schemaChanges)
    const result = await createNewVersionBackground({
      buildingSchemaId,
      latestVersionNumber,
      patch: operations,
    })

    if (!result.success) {
      return {
        ...state,
        generatedAnswer: message,
        error: result.error || 'Failed to update schema',
      }
    }

    return {
      ...state,
      generatedAnswer: message,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      ...state,
      generatedAnswer: message,
      error: `Failed to update schema: ${errorMessage}`,
    }
  }
}

/**
 * Handle schema changes if they exist (background version)
 */
const handleSchemaChanges = async (
  parsedResponse: BuildAgentResponse,
  state: WorkflowState,
): Promise<WorkflowState> => {
  if (parsedResponse.schemaChanges.length === 0) {
    return {
      ...state,
      generatedAnswer: parsedResponse.message,
    }
  }

  const buildingSchemaId = state.buildingSchemaId
  const latestVersionNumber = state.latestVersionNumber || 0

  if (!buildingSchemaId) {
    console.warn('Missing buildingSchemaId for schema update')
    return {
      ...state,
      generatedAnswer: parsedResponse.message,
    }
  }

  return await applySchemaChanges(
    parsedResponse.schemaChanges,
    buildingSchemaId,
    latestVersionNumber,
    parsedResponse.message,
    state,
  )
}

/**
 * Handle buildAgent response processing (background version)
 */
const handleBuildAgentResponse = async (
  response: string,
  state: WorkflowState,
): Promise<WorkflowState> => {
  const parsedResponse = parseStructuredResponse(response)

  if (!parsedResponse) {
    console.warn(
      'Failed to parse buildAgent response as structured JSON, using raw response',
    )
    return {
      ...state,
      generatedAnswer: response,
    }
  }

  return await handleSchemaChanges(parsedResponse, state)
}

async function prepareAnswerGeneration(
  state: WorkflowState,
): Promise<PreparedAnswerGeneration | { error: string }> {
  // Since validationNode has already validated required fields,
  // we can trust that the processed data is available
  if (!state.agentName || !state.schemaText || !state.formattedChatHistory) {
    return { error: 'Required processed data is missing from validation step' }
  }

  const agentName = state.agentName
  const formattedChatHistory = state.formattedChatHistory
  const schemaText = state.schemaText

  // Get the agent from LangChain
  const agent = getAgent(agentName)

  return {
    agent,
    agentName,
    schemaText,
    formattedChatHistory,
  }
}

/**
 * Answer generation node for background jobs - synchronous execution only
 * This version uses background-compatible database clients
 */
export async function answerGenerationNodeBackground(
  state: WorkflowState,
): Promise<WorkflowState> {
  try {
    const prepared = await prepareAnswerGeneration(state)

    if ('error' in prepared) {
      return {
        ...state,
        error: prepared.error,
      }
    }

    const { agent, agentName, schemaText, formattedChatHistory } = prepared

    // Convert formatted chat history to array format if needed
    const historyArray: [string, string][] = formattedChatHistory
      ? [['Assistant', formattedChatHistory]]
      : []

    // Create prompt variables with correct format
    const promptVariables = createPromptVariables(
      schemaText,
      state.userInput,
      historyArray,
    )

    // Use agent's generate method with prompt variables
    const response = await agent.generate(promptVariables)

    // If this is the buildAgent, handle structured response and schema updates
    if (agentName === 'databaseSchemaBuildAgent') {
      return await handleBuildAgentResponse(response, state)
    }

    return {
      ...state,
      generatedAnswer: response,
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Failed to generate answer'
    return {
      ...state,
      error: errorMsg,
    }
  }
}
