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

interface ChatState {
  mode?: WorkflowMode | undefined
  userInput: string
  generatedAnswer?: string | undefined
  finalResponse?: string | undefined
  history: string[]
  schemaData?: Schema | undefined
  projectId?: string | undefined
  buildingSchemaId: string
  error?: string | undefined

  schemaText?: string | undefined
  formattedChatHistory?: string | undefined
  agentName?: AgentName | undefined

  latestVersionNumber?: number | undefined
  organizationId?: string | undefined
  userId?: string | undefined
}

const DEFAULT_RECURSION_LIMIT = 10

const createAnnotations = () => {
  return Annotation.Root({
    mode: Annotation<WorkflowMode | undefined>,
    userInput: Annotation<string>,
    generatedAnswer: Annotation<string | undefined>,
    finalResponse: Annotation<string | undefined>,
    history: Annotation<string[]>,
    schemaData: Annotation<Schema | undefined>,
    projectId: Annotation<string | undefined>,
    buildingSchemaId: Annotation<string>,
    error: Annotation<string | undefined>,

    schemaText: Annotation<string | undefined>,
    formattedChatHistory: Annotation<string | undefined>,
    agentName: Annotation<AgentName | undefined>,

    latestVersionNumber: Annotation<number | undefined>,
    organizationId: Annotation<string | undefined>,
    userId: Annotation<string | undefined>,
  })
}

const validateInput = async (state: ChatState): Promise<Partial<ChatState>> => {
  return validationNode(state)
}

const generateAnswer = async (
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

const formatFinalResponse = async (
  state: ChatState,
): Promise<Partial<ChatState>> => {
  const result = await finalResponseNode(state, { streaming: false })
  return result
}

const createGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  graph
    .addNode('validateInput', validateInput)
    .addNode('generateAnswer', generateAnswer)
    .addNode('formatFinalResponse', formatFinalResponse)
    .addEdge(START, 'validateInput')
    .addEdge('formatFinalResponse', END)

    .addConditionalEdges('validateInput', (state: ChatState) => {
      if (state.error) return 'formatFinalResponse'
      return 'generateAnswer'
    })
    .addConditionalEdges('generateAnswer', () => {
      return 'formatFinalResponse'
    })

  return graph.compile()
}

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

    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED

    const errorState = createErrorState(initialState, errorMessage)
    return await finalResponseNode(errorState, { streaming: false })
  }
}

export { executeLangGraphWorkflow as LangGraphWorkflow }
