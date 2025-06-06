import type { WorkflowState } from '../types'

function* splitIntoChunks(text: string, chunkSize = 3): Generator<string> {
  const words = text.split(/\b/)
  let currentChunk = ''

  for (const word of words) {
    currentChunk += word

    if (currentChunk.length >= chunkSize || /[.!?]\s*$/.test(currentChunk)) {
      yield currentChunk
      currentChunk = ''
    }
  }

  if (currentChunk) {
    yield currentChunk
  }
}

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

const finalResponseNodeSync = async (
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    let finalResponse: string
    let errorToReturn: string | undefined

    if (state.error) {
      finalResponse = `Sorry, an error occurred during processing: ${state.error}`
      errorToReturn = state.error
    } else if (state.generatedAnswer) {
      finalResponse = state.generatedAnswer
      errorToReturn = undefined
    } else {
      finalResponse =
        'Sorry, we could not generate an answer. Please try again.'
      errorToReturn = 'No generated answer available'
    }

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

    if (state.error) {
      finalResponse = `Sorry, an error occurred during processing: ${state.error}`
      errorToReturn = state.error
    } else if (state.generatedAnswer) {
      finalResponse = state.generatedAnswer
      errorToReturn = undefined
    } else {
      finalResponse =
        'Sorry, we could not generate an answer. Please try again.'
      errorToReturn = 'No generated answer available'
    }

    for (const chunk of splitIntoChunks(finalResponse)) {
      yield { type: 'text', content: chunk }
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

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
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create final response'
    const fallbackResponse = `Sorry, a system error occurred: ${errorMessage}`

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
