import { Annotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import { WORKFLOW_ERROR_MESSAGES } from '../constants/progressMessages'
import { answerGenerationNode, validationNode } from '../nodes'
import type { AgentName } from '../types'

/**
 * ChatState definition for LangGraph (shared between streaming and non-streaming)
 */
export interface ChatState {
  userInput: string
  generatedAnswer?: string | undefined
  finalResponse?: string | undefined
  history: string[]
  schemaData?: Schema | undefined
  projectId?: string | undefined
  buildingSchemaId?: string | undefined
  latestVersionNumber?: number | undefined
  organizationId?: string | undefined
  userId?: string | undefined
  error?: string | undefined

  // Intermediate data for workflow
  schemaText?: string | undefined
  formattedChatHistory?: string | undefined
  agentName?: AgentName | undefined
}

export const DEFAULT_RECURSION_LIMIT = 10

/**
 * Create LangGraph-compatible annotations (shared)
 */
export const createAnnotations = () => {
  return Annotation.Root({
    userInput: Annotation<string>,
    generatedAnswer: Annotation<string | undefined>,
    finalResponse: Annotation<string | undefined>,
    history: Annotation<string[]>,
    schemaData: Annotation<Schema | undefined>,
    projectId: Annotation<string | undefined>,
    buildingSchemaId: Annotation<string | undefined>,
    latestVersionNumber: Annotation<number | undefined>,
    organizationId: Annotation<string | undefined>,
    userId: Annotation<string | undefined>,
    error: Annotation<string | undefined>,

    // Additional fields for workflow processing
    schemaText: Annotation<string | undefined>,
    formattedChatHistory: Annotation<string | undefined>,
    agentName: Annotation<AgentName | undefined>,
  })
}

/**
 * Wrap validationNode for LangGraph (shared)
 */
export const validateInput = async (
  state: ChatState,
): Promise<Partial<ChatState>> => {
  return validationNode(state)
}

/**
 * Wrap answerGenerationNode for LangGraph (shared)
 */
export const generateAnswer = async (
  state: ChatState,
): Promise<Partial<ChatState>> => {
  try {
    const result = await answerGenerationNode(state)
    return {
      generatedAnswer: result.generatedAnswer,
      error: result.error,
    }
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : WORKFLOW_ERROR_MESSAGES.ANSWER_GENERATION_FAILED,
    }
  }
}
