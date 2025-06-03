import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import {
  answerGenerationNode,
  finalResponseNode,
  validationNode,
} from './nodes'
import type { AgentName, WorkflowState } from './types'

/**
 * ChatState definition for LangGraph
 */
interface ChatState {
  mode?: 'Ask' | 'Build'
  userInput: string
  generatedAnswer?: string
  finalResponse?: string
  history: string[]
  schemaData?: Schema
  projectId?: string
  error?: string

  // Intermediate data for workflow
  schemaText?: string
  formattedChatHistory?: string
  agentName?: AgentName
}

// Define ResponseChunk type
type ResponseChunk = { type: 'text' | 'error' | 'custom'; content: string }

// LangGraph-compatible annotations
const ChatStateAnnotation = Annotation.Root({
  mode: Annotation<'Ask' | 'Build' | undefined>,
  userInput: Annotation<string>,
  generatedAnswer: Annotation<string>,
  finalResponse: Annotation<string>,
  history: Annotation<string[]>,
  schemaData: Annotation<Schema>,
  projectId: Annotation<string>,
  error: Annotation<string>,

  // Additional fields for workflow processing
  schemaText: Annotation<string>,
  formattedChatHistory: Annotation<string>,
  agentName: Annotation<AgentName>,
})

/**
 * Wrap validationNode to match LangGraph node format
 */
const validateInput = async (state: ChatState): Promise<Partial<ChatState>> =>
  validationNode(state)

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
      error: e instanceof Error ? e.message : 'Failed to generate answer',
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
 * Workflow execution options
 */
interface WorkflowOptions {
  streaming?: boolean
  recursionLimit?: number
}

/**
 * Unified workflow execution function
 */
export function executeChatWorkflow(
  initialState: WorkflowState,
): AsyncGenerator<
  { type: 'text' | 'error' | 'custom'; content: string },
  WorkflowState,
  unknown
>
export function executeChatWorkflow(
  initialState: WorkflowState,
  options: WorkflowOptions & { streaming: true },
): AsyncGenerator<
  { type: 'text' | 'error' | 'custom'; content: string },
  WorkflowState,
  unknown
>
export function executeChatWorkflow(
  initialState: WorkflowState,
  options: WorkflowOptions & { streaming: false },
): Promise<WorkflowState>
export function executeChatWorkflow(
  initialState: WorkflowState,
  options?: WorkflowOptions,
):
  | Promise<WorkflowState>
  | AsyncGenerator<
      { type: 'text' | 'error' | 'custom'; content: string },
      WorkflowState,
      unknown
    > {
  const streaming = options?.streaming ?? false
  const recursionLimit = options?.recursionLimit ?? 10
  if (streaming === false) {
    return executeChatWorkflowSyncInternal(initialState, recursionLimit)
  }
  return executeChatWorkflowStreamingInternal(initialState)
}

/**
 * Internal implementation functions
 */
// Non-streaming implementation using LangGraph
const executeChatWorkflowSyncInternal = async (
  initialState: WorkflowState,
  recursionLimit: number,
): Promise<WorkflowState> => {
  try {
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

    // Execution
    const compiled = graph.compile()
    const result = await compiled.invoke(
      {
        mode: initialState.mode,
        userInput: initialState.userInput,
        history: initialState.history || [],
        schemaData: initialState.schemaData,
        projectId: initialState.projectId,
      },
      {
        recursionLimit, // Use configurable recursion limit
      },
    )

    return {
      mode: result.mode,
      userInput: result.userInput,
      generatedAnswer: result.generatedAnswer,
      finalResponse: result.finalResponse,
      history: result.history || [],
      schemaData: result.schemaData,
      projectId: result.projectId,
      error: result.error,
    }
  } catch (error) {
    console.error(
      'LangGraph execution failed, falling back to error state:',
      error,
    )
    // Even with LangGraph execution failure, go through finalResponseNode to ensure proper response
    const errorMessage =
      error instanceof Error ? error.message : 'Workflow execution failed'
    const errorState = {
      ...initialState,
      error: errorMessage,
    }
    return await finalResponseNode(errorState, { streaming: false })
  }
}

// Define success and failure result types
type ValidationSuccess = { state: WorkflowState; error?: never }
type ValidationFailure = {
  error: string
  finalState: WorkflowState
  state?: never
}
type ValidationResult = ValidationSuccess | ValidationFailure

// Type guard function for error checking
function isValidationFailure(
  result: ValidationResult,
): result is ValidationFailure {
  return 'error' in result && typeof result.error === 'string'
}

// Helper function for validation step
async function runValidationStep(
  initialState: WorkflowState,
): Promise<ValidationResult> {
  const validationResult = await validationNode(initialState)

  if (validationResult.error) {
    const errorState = {
      ...initialState,
      error: validationResult.error,
    }
    const finalResult = await finalResponseNode(errorState, {
      streaming: false,
    })
    return { error: validationResult.error, finalState: finalResult }
  }

  return { state: { ...initialState, ...validationResult } }
}

// Helper function for answer generation step
async function runAnswerGenerationStep(
  state: WorkflowState,
): Promise<ValidationResult> {
  const answerResult = await answerGenerationNode(state)

  if (answerResult.error) {
    const errorState = {
      ...state,
      error: answerResult.error,
    }
    const finalResult = await finalResponseNode(errorState, {
      streaming: false,
    })
    return { error: answerResult.error, finalState: finalResult }
  }

  return { state: { ...state, ...answerResult } }
}

// Helper function to prepare final response
function prepareFinalResponse(
  state: WorkflowState,
  initialState: WorkflowState,
): {
  finalState: WorkflowState
  generator: AsyncGenerator<ResponseChunk, WorkflowState, unknown>
} {
  // Prepare final state for streaming
  const finalState: WorkflowState = {
    mode: state.mode || initialState.mode,
    userInput: state.userInput || initialState.userInput,
    history: state.history || initialState.history || [],
    schemaData: state.schemaData || initialState.schemaData,
    projectId: state.projectId || initialState.projectId,
    generatedAnswer: state.generatedAnswer,
    // Include processed fields
    schemaText: state.schemaText,
    formattedChatHistory: state.formattedChatHistory,
    agentName: state.agentName,
  }

  const generator = finalResponseNode(finalState)
  return { finalState, generator }
}

// Helper function to get final state
async function getFinalState(
  generator: AsyncGenerator<ResponseChunk, WorkflowState, unknown>,
  finalState: WorkflowState,
): Promise<WorkflowState> {
  // Get the final result from the generator
  const generatorResult = await generator.next()
  // Type guard to check if value is WorkflowState
  const value = generatorResult.value
  const isWorkflowState = (val: unknown): val is WorkflowState => {
    return (
      val !== null &&
      typeof val === 'object' &&
      'userInput' in val &&
      'history' in val
    )
  }

  return (
    (isWorkflowState(value) ? value : null) || {
      ...finalState,
      finalResponse: finalState.generatedAnswer || 'No response generated',
      history: [
        ...finalState.history,
        `User: ${finalState.userInput}`,
        `Assistant: ${finalState.generatedAnswer || 'No response generated'}`,
      ],
    }
  )
}

// Streaming implementation: LangGraph for validation + answerGeneration, streaming for finalResponse
const executeChatWorkflowStreamingInternal = async function* (
  initialState: WorkflowState,
): AsyncGenerator<
  { type: 'text' | 'error' | 'custom'; content: string },
  WorkflowState,
  unknown
> {
  try {
    // Step 1: Validation
    yield { type: 'custom', content: '🔍 Checking your input... 🔄' }
    const validationResult = await runValidationStep(initialState)

    if (isValidationFailure(validationResult)) {
      yield { type: 'custom', content: '🔍 Checking your input... ❌' }
      yield { type: 'error', content: validationResult.error }
      return validationResult.finalState
    }

    yield { type: 'custom', content: '🔍 Checking your input... ✅' }

    // Step 2: Answer Generation
    yield { type: 'custom', content: '💬 Generating an answer... 🔄' }
    const answerResult = await runAnswerGenerationStep(validationResult.state)

    if (isValidationFailure(answerResult)) {
      yield { type: 'custom', content: '💬 Generating an answer... ❌' }
      yield { type: 'error', content: answerResult.error }
      return answerResult.finalState
    }

    yield { type: 'custom', content: '💬 Generating an answer... ✅' }

    // Step 3: Final Response
    yield { type: 'custom', content: '📦 Formatting the final response... 🔄' }

    // Stream the final response
    const { finalState, generator } = prepareFinalResponse(
      answerResult.state,
      initialState,
    )

    for await (const chunk of generator) {
      if (chunk.type === 'text' || chunk.type === 'error') {
        yield chunk
      }
    }

    yield { type: 'custom', content: '📦 Formatting the final response... ✅' }

    // Get final state from generator
    const finalResult = await getFinalState(generator, finalState)
    return finalResult
  } catch (error) {
    console.error(
      'LangGraph streaming execution failed, falling back to error state:',
      error,
    )
    const errorMessage =
      error instanceof Error ? error.message : 'Workflow execution failed'
    yield {
      type: 'error',
      content: errorMessage,
    }
    // Even with catch error, go through finalResponseNode to ensure proper response
    const errorState = {
      ...initialState,
      error: errorMessage,
    }
    const finalResult = await finalResponseNode(errorState, {
      streaming: false,
    })
    return finalResult
  }
}
