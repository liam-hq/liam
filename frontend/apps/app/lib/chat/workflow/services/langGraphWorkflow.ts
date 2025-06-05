import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import { WORKFLOW_ERROR_MESSAGES } from '../constants/progressMessages'
import {
  answerGenerationNode,
  finalResponseNode,
  validationNode,
} from '../nodes'
import type { AgentName, WorkflowMode, WorkflowState } from '../types'
import {
  createErrorState,
  fromLangGraphResult,
  toLangGraphState,
} from './stateManager'

/**
 * ChatState definition for LangGraph
 */
interface ChatState {
  mode?: WorkflowMode
  userInput: string
  generatedAnswer?: string
  finalResponse?: string
  history: string[]
  schemaData?: Schema
  projectId?: string
  buildingSchemaId: string
  error?: string

  // Intermediate data for workflow
  schemaText?: string
  formattedChatHistory?: string
  agentName?: AgentName
}

const DEFAULT_RECURSION_LIMIT = 10

/**
 * Create LangGraph-compatible annotations
 */
const createAnnotations = () => {
  return Annotation.Root({
    mode: Annotation<WorkflowMode | undefined>,
    userInput: Annotation<string>,
    generatedAnswer: Annotation<string>,
    finalResponse: Annotation<string>,
    history: Annotation<string[]>,
    schemaData: Annotation<Schema>,
    projectId: Annotation<string>,
    buildingSchemaId: Annotation<string>,
    error: Annotation<string>,

    // Additional fields for workflow processing
    schemaText: Annotation<string>,
    formattedChatHistory: Annotation<string>,
    agentName: Annotation<AgentName>,
  })
}

/**
 * Wrap validationNode to match LangGraph node format
 */
const validateInput = async (state: ChatState): Promise<Partial<ChatState>> => {
  return validationNode(state)
}

/**
 * Wrap answerGenerationNode for non-streaming execution
 */
const generateAnswer = async (
  state: ChatState,
): Promise<Partial<ChatState>> => {
  try {
    // Use synchronous execution (streaming is now handled by finalResponseNode)
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

/**
 * Wrap finalResponseNode for non-streaming execution
 */
const formatFinalResponse = async (
  state: ChatState,
): Promise<Partial<ChatState>> => {
  const result = await finalResponseNode(state, { streaming: false })
  return result
}

/**
 * Create and configure the LangGraph workflow
 */
const createGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  graph
    .addNode('validateInput', validateInput)
    .addNode('generateAnswer', generateAnswer)
    .addNode('formatFinalResponse', formatFinalResponse)
    .addEdge(START, 'validateInput')
    .addEdge('formatFinalResponse', END)

    // Conditional edges - simplified to prevent loops
    .addConditionalEdges('validateInput', (state: ChatState) => {
      if (state.error) return 'formatFinalResponse'
      return 'generateAnswer'
    })
    .addConditionalEdges('generateAnswer', () => {
      // Always go to formatFinalResponse regardless of error state
      return 'formatFinalResponse'
    })

  return graph.compile()
}

/**
 * Execute non-streaming workflow using LangGraph
 */
const executeLangGraphWorkflow = async (
  initialState: WorkflowState,
  recursionLimit: number = DEFAULT_RECURSION_LIMIT,
): Promise<WorkflowState> => {
  try {
    const compiled = createGraph()

    const result = await compiled.invoke(toLangGraphState(initialState), {
      recursionLimit,
    })

    return fromLangGraphResult(result)
  } catch (error) {
    console.error(WORKFLOW_ERROR_MESSAGES.LANGGRAPH_FAILED, error)

    // Even with LangGraph execution failure, go through finalResponseNode to ensure proper response
    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED

    const errorState = createErrorState(initialState, errorMessage)
    return await finalResponseNode(errorState, { streaming: false })
  }
}

// Export for backward compatibility
export { executeLangGraphWorkflow as LangGraphWorkflow }
