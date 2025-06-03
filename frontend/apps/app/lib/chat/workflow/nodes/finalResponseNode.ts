import type { WorkflowState } from '../types'

// Helper function to split text into chunks for streaming
function* splitIntoChunks(text: string, chunkSize = 1): Generator<string> {
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize)
  }
}

// Overloaded function signatures for finalResponseNode
export function finalResponseNode(
  state: WorkflowState,
  options: { streaming: false },
): Promise<WorkflowState>
export function finalResponseNode(
  state: WorkflowState,
  options?: { streaming?: true },
): AsyncGenerator<
  { type: 'text' | 'error' | 'custom'; content: string },
  WorkflowState,
  unknown
>
export function finalResponseNode(
  state: WorkflowState,
  options: { streaming?: boolean } = { streaming: true },
):
  | Promise<WorkflowState>
  | AsyncGenerator<
      { type: 'text' | 'error' | 'custom'; content: string },
      WorkflowState,
      unknown
    > {
  const streaming = options.streaming ?? true

  if (!streaming) {
    return finalResponseNodeSync(state)
  }
  return finalResponseNodeStreaming(state)
}

// Non-streaming implementation
const finalResponseNodeSync = async (
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    let finalResponse: string
    let errorToReturn: string | undefined

    // Handle different scenarios for final response
    if (state.error) {
      // If there's an error, create an error response for the user
      finalResponse = `Sorry, an error occurred during processing: ${state.error}`
      errorToReturn = state.error
    } else if (state.generatedAnswer) {
      // Normal case: use the generated answer
      finalResponse = state.generatedAnswer
      errorToReturn = undefined
    } else {
      // Fallback case: no generated answer and no specific error
      finalResponse =
        'Sorry, we could not generate an answer. Please try again.'
      errorToReturn = 'No generated answer available'
    }

    // Update chat history with the new conversation
    const updatedHistory = [
      ...state.history,
      `User: ${state.userInput}`,
      `Assistant: ${finalResponse}`,
    ]

    return {
      ...state,
      finalResponse,
      history: updatedHistory,
      error: errorToReturn,
    }
  } catch (error) {
    // Fallback error handling
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create final response'
    const fallbackResponse = `Sorry, a system error occurred: ${errorMessage}`

    return {
      ...state,
      finalResponse: fallbackResponse,
      history: [
        ...state.history,
        `User: ${state.userInput}`,
        `Assistant: ${fallbackResponse}`,
      ],
      error: errorMessage,
    }
  }
}

// Streaming implementation
const finalResponseNodeStreaming = async function* (
  state: WorkflowState,
): AsyncGenerator<
  { type: 'text' | 'error' | 'custom'; content: string },
  WorkflowState,
  unknown
> {
  try {
    let finalResponse: string
    let errorToReturn: string | undefined

    // Handle different scenarios for final response
    if (state.error) {
      finalResponse = `Sorry, an error occurred during processing: ${state.error}`
      errorToReturn = state.error
    } else if (state.generatedAnswer) {
      // Normal case: use the generated answer
      // TODO: Add response validation here in the future
      finalResponse = state.generatedAnswer
      errorToReturn = undefined
    } else {
      // Fallback case: no generated answer and no specific error
      finalResponse =
        'Sorry, we could not generate an answer. Please try again.'
      errorToReturn = 'No generated answer available'
    }

    // Stream the final response character by character
    for (const chunk of splitIntoChunks(finalResponse)) {
      yield { type: 'text', content: chunk }
      // Add a small delay to simulate realistic streaming
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    // Update chat history with the new conversation
    const updatedHistory = [
      ...state.history,
      `User: ${state.userInput}`,
      `Assistant: ${finalResponse}`,
    ]

    return {
      ...state,
      finalResponse,
      history: updatedHistory,
      error: errorToReturn,
    }
  } catch (error) {
    // Fallback error handling
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create final response'
    const fallbackResponse = `Sorry, a system error occurred: ${errorMessage}`

    // Stream the error response
    for (const chunk of splitIntoChunks(fallbackResponse)) {
      yield { type: 'text', content: chunk }
    }

    return {
      ...state,
      finalResponse: fallbackResponse,
      history: [
        ...state.history,
        `User: ${state.userInput}`,
        `Assistant: ${fallbackResponse}`,
      ],
      error: errorMessage,
    }
  }
}
