import {
  type AgentName,
  createPromptVariables,
  getAgent,
} from '../../../langchain'
import { createNewVersion } from '@/libs/schema/createNewVersion'
import type { Operation } from 'fast-json-patch'
import * as v from 'valibot'
import type { WorkflowState } from '../types'

interface PreparedAnswerGeneration {
  agent: ReturnType<typeof getAgent>
  agentName: AgentName
  schemaText: string
  formattedChatHistory: string
}

const jsonPatchOperationSchema = v.object({
  op: v.picklist(['add', 'remove', 'replace', 'move', 'copy', 'test']),
  path: v.string(),
  value: v.optional(v.unknown()),
  from: v.optional(v.string()),
})

const buildAgentResponseSchema = v.object({
  message: v.string(),
  schemaChanges: v.array(jsonPatchOperationSchema),
})

type BuildAgentResponse = v.InferOutput<typeof buildAgentResponseSchema>

const parseStructuredResponse = (
  response: string,
): BuildAgentResponse | null => {
  try {
    const parsed: unknown = JSON.parse(response)

    const validationResult = v.safeParse(buildAgentResponseSchema, parsed)

    if (validationResult.success) {
      return {
        message: validationResult.output.message,
        schemaChanges: validationResult.output.schemaChanges,
      }
    }

    console.warn(
      'BuildAgent response validation failed:',
      validationResult.issues,
    )
    return null
  } catch (error) {
    console.warn('Failed to parse BuildAgent response as JSON:', error)
    return null
  }
}

const convertToOperations = (
  schemaChanges: BuildAgentResponse['schemaChanges'],
): Operation[] => {
  return schemaChanges.map((change): Operation => {
    const baseOperation = {
      op: change.op,
      path: change.path,
    }

    const operation = {
      ...baseOperation,
      ...(change.value !== undefined && { value: change.value }),
      ...(change.from !== undefined && { from: change.from }),
    }

    return operation as Operation
  })
}

const applySchemaChanges = async (
  schemaChanges: BuildAgentResponse['schemaChanges'],
  buildingSchemaId: string,
  latestVersionNumber: number,
  message: string,
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    const operations = convertToOperations(schemaChanges)
    const result = await createNewVersion({
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
      error: undefined,
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

const handleSchemaChanges = async (
  parsedResponse: BuildAgentResponse,
  state: WorkflowState,
): Promise<WorkflowState> => {
  if (parsedResponse.schemaChanges.length === 0) {
    return {
      ...state,
      generatedAnswer: parsedResponse.message,
      error: undefined,
    }
  }

  const buildingSchemaId = state.buildingSchemaId
  const latestVersionNumber = state.latestVersionNumber || 0

  if (!buildingSchemaId) {
    console.warn('Missing buildingSchemaId for schema update')
    return {
      ...state,
      generatedAnswer: parsedResponse.message,
      error: undefined,
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
      error: undefined,
    }
  }

  return await handleSchemaChanges(parsedResponse, state)
}

async function prepareAnswerGeneration(
  state: WorkflowState,
): Promise<PreparedAnswerGeneration | { error: string }> {
  if (!state.agentName || !state.schemaText || !state.formattedChatHistory) {
    return { error: 'Required processed data is missing from validation step' }
  }

  const agentName = state.agentName
  const formattedChatHistory = state.formattedChatHistory
  const schemaText = state.schemaText

  const agent = getAgent(agentName)

  return {
    agent,
    agentName,
    schemaText,
    formattedChatHistory,
  }
}

export async function answerGenerationNode(
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

    const historyArray: [string, string][] = formattedChatHistory
      ? [['Assistant', formattedChatHistory]]
      : []

    const promptVariables = createPromptVariables(
      schemaText,
      state.userInput,
      historyArray,
    )

    const response = await agent.generate(promptVariables)

    if (agentName === 'databaseSchemaBuildAgent') {
      return await handleBuildAgentResponse(response, state)
    }

    return {
      ...state,
      generatedAnswer: response,
      error: undefined,
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
