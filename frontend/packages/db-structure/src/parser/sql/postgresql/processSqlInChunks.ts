import type { ProcessError } from '../../errors.js'

/**
 * Retry direction for chunk processing
 */
const retryDirectionValues = {
  decrease: -1, // Shrinking mode
  increase: 1, // Expanding mode
} as const

type RetryDirection = -1 | 1

/**
 * Determines the line number in a string corresponding to a given character index.
 *
 * @param inputString - The string to search within.
 * @param charIndex - The character index.
 * @returns The line number, or null if the index is out of bounds.
 */
function getLineNumber(inputString: string, charIndex: number): number | null {
  if (charIndex < 0 || charIndex >= inputString.length) return null

  let lineNumber = 1
  let currentIndex = 0

  for (const char of inputString) {
    if (currentIndex === charIndex) return lineNumber
    if (char === '\n') lineNumber++
    currentIndex++
  }

  return null
}

/**
 * Handle successful chunk processing
 */
function handleSuccessfulProcessing(
  adjustedChunkSize: number,
  retryDirection: RetryDirection,
  startIndex: number,
  readOffset: number | null,
  chunk: string,
): {
  newChunkSize: number
  newRetryDirection: RetryDirection
  nextIndex: number
  errors: ProcessError[]
  shouldBreak: boolean
} {
  if (readOffset !== null) {
    const lineNumber = getLineNumber(chunk, readOffset)
    if (lineNumber === null) {
      throw new Error('UnexpectedCondition. lineNumber === null')
    }
    return {
      newChunkSize: adjustedChunkSize,
      newRetryDirection: retryDirection,
      nextIndex: startIndex + lineNumber,
      errors: [],
      shouldBreak: true,
    }
  }

  return {
    newChunkSize: adjustedChunkSize,
    newRetryDirection: retryDirection,
    nextIndex: startIndex + adjustedChunkSize,
    errors: [],
    shouldBreak: true,
  }
}

/**
 * Handle retry with decreasing chunk size
 */
function handleDecreasingChunkSize(
  adjustedChunkSize: number,
  originalChunkSize: number,
): {
  newChunkSize: number
  newRetryDirection: RetryDirection
  nextIndex: number | null
  errors: ProcessError[]
  shouldBreak: boolean
} {
  const newChunkSize = adjustedChunkSize - 1

  if (newChunkSize === 0) {
    return {
      newChunkSize: originalChunkSize,
      newRetryDirection: retryDirectionValues.increase,
      nextIndex: null,
      errors: [],
      shouldBreak: false,
    }
  }

  return {
    newChunkSize,
    newRetryDirection: retryDirectionValues.decrease,
    nextIndex: null,
    errors: [],
    shouldBreak: false,
  }
}

/**
 * Handle retry with increasing chunk size
 */
function handleIncreasingChunkSize(
  adjustedChunkSize: number,
  originalChunkSize: number,
  startIndex: number,
  lines: string[],
  errors: ProcessError[],
): {
  newChunkSize: number
  newRetryDirection: RetryDirection
  nextIndex: number | null
  errors: ProcessError[]
  shouldBreak: boolean
} {
  const newChunkSize = adjustedChunkSize + 1

  // Check if we've reached the end of the input
  if (startIndex + newChunkSize > lines.length) {
    return {
      newChunkSize,
      newRetryDirection: retryDirectionValues.increase,
      nextIndex: null,
      errors,
      shouldBreak: true,
    }
  }

  // Prevent excessive memory usage
  if (newChunkSize > originalChunkSize * 2) {
    return {
      newChunkSize,
      newRetryDirection: retryDirectionValues.increase,
      nextIndex: null,
      errors,
      shouldBreak: true,
    }
  }

  return {
    newChunkSize,
    newRetryDirection: retryDirectionValues.increase,
    nextIndex: null,
    errors: [],
    shouldBreak: false,
  }
}

/**
 * Handles retry logic for chunk processing
 */
async function handleRetry(
  lines: string[],
  startIndex: number,
  currentChunkSize: number,
  originalChunkSize: number,
  retryDirection: RetryDirection,
  callback: (
    chunk: string,
  ) => Promise<[number | null, number | null, ProcessError[]]>,
): Promise<{
  newChunkSize: number
  newRetryDirection: RetryDirection
  nextIndex: number | null
  errors: ProcessError[]
  shouldBreak: boolean
}> {
  // Adjust chunk size if needed
  let adjustedChunkSize = currentChunkSize
  if (
    retryDirection === retryDirectionValues.decrease &&
    startIndex + adjustedChunkSize > lines.length
  ) {
    adjustedChunkSize = lines.length - startIndex
  }

  // Process the chunk
  const chunk = lines
    .slice(startIndex, startIndex + adjustedChunkSize)
    .join('\n')
  const [retryOffset, readOffset, errors] = await callback(chunk)

  // Handle successful processing (no retry needed)
  if (retryOffset === null) {
    return handleSuccessfulProcessing(
      adjustedChunkSize,
      retryDirection,
      startIndex,
      readOffset,
      chunk,
    )
  }

  // Handle retry based on direction
  if (retryDirection === retryDirectionValues.decrease) {
    return handleDecreasingChunkSize(adjustedChunkSize, originalChunkSize)
  }

  return handleIncreasingChunkSize(
    adjustedChunkSize,
    originalChunkSize,
    startIndex,
    lines,
    errors,
  )
}

/**
 * Process a single position in the input
 */
async function processPosition(
  lines: string[],
  startIndex: number,
  chunkSize: number,
  callback: (
    chunk: string,
  ) => Promise<[number | null, number | null, ProcessError[]]>,
): Promise<{
  newIndex: number
  errors: ProcessError[]
}> {
  let currentChunkSize = chunkSize
  let retryDirection: RetryDirection = retryDirectionValues.decrease
  const errors: ProcessError[] = []

  while (true) {
    const result = await handleRetry(
      lines,
      startIndex,
      currentChunkSize,
      chunkSize,
      retryDirection,
      callback,
    )

    currentChunkSize = result.newChunkSize
    retryDirection = result.newRetryDirection

    if (result.errors.length > 0) {
      errors.push(...result.errors)
    }

    if (result.shouldBreak) {
      return {
        newIndex: result.nextIndex !== null ? result.nextIndex : startIndex,
        errors,
      }
    }
  }
}

/**
 * Processes a large SQL input string in chunks (by line count)
 *
 * @param sqlInput - The SQL input string to be processed.
 * @param chunkSize - The number of lines per chunk (e.g., 500).
 * @param callback - An asynchronous function to process each chunk.
 * @returns A tuple of [retryOffset, readOffset, errors] where:
 *   - retryOffset: Position where parsing failed, indicating where to retry from with a different chunk size
 *   - readOffset: Position of the last successfully parsed statement, used for partial chunk processing
 *   - errors: Array of parsing errors encountered during processing
 */
export const processSQLInChunks = async (
  sqlInput: string,
  chunkSize: number,
  callback: (
    chunk: string,
  ) => Promise<[number | null, number | null, ProcessError[]]>,
): Promise<ProcessError[]> => {
  if (sqlInput === '') return []

  const lines = sqlInput.split('\n')
  const processErrors: ProcessError[] = []

  for (let i = 0; i < lines.length; ) {
    // Stop processing if we've encountered errors
    if (processErrors.length > 0) break

    const { newIndex, errors } = await processPosition(
      lines,
      i,
      chunkSize,
      callback,
    )

    if (errors.length > 0) {
      processErrors.push(...errors)
      break
    }

    i = newIndex
  }

  return processErrors
}
