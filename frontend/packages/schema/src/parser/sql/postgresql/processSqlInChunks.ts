import { err, ok, type Result } from 'neverthrow'
import type { ProcessError } from '../../errors.js'

/**
 * Retry direction for chunk processing
 */
const retryDirectionValues = {
  decrease: -1, // Shrinking mode
  increase: 1, // Expanding mode
} as const

type RetryDirection = -1 | 1

// pg-query-emscripten returns offsets measured in UTF-8 bytes, whereas the
// chunking code operates on JS string indices (UTF-16 code units). These
// helpers bridge the two so multiline reads stay aligned even with multibyte
// characters.
function getUtf8ByteLength(codePoint: number): number {
  // Validate Unicode code point range
  // Surrogate pairs (0xD800-0xDFFF) are invalid standalone code points
  // Code points above 0x10FFFF exceed the Unicode limit
  if (codePoint >= 0xd800 && codePoint <= 0xdfff) return -1
  if (codePoint > 0x10ffff) return -1

  if (codePoint <= 0x7f) return 1
  if (codePoint <= 0x7ff) return 2
  if (codePoint <= 0xffff) return 3
  return 4
}

function utf8ByteOffsetToCharIndex(
  input: string,
  byteOffset: number,
): number | null {
  if (byteOffset < 0) return null

  let bytesConsumed = 0
  for (let i = 0; i < input.length; ) {
    if (bytesConsumed === byteOffset) {
      return i
    }

    const codePoint = input.codePointAt(i)
    if (codePoint === undefined) return null

    const utf8Length = getUtf8ByteLength(codePoint)
    if (utf8Length < 0) {
      // Invalid code point (surrogate or out of range)
      return null
    }
    if (bytesConsumed + utf8Length > byteOffset) {
      return null
    }

    bytesConsumed += utf8Length
    const codeUnitLength = codePoint > 0xffff ? 2 : 1
    i += codeUnitLength

    if (bytesConsumed === byteOffset) {
      return i
    }
  }

  if (bytesConsumed === byteOffset) {
    return input.length
  }

  return null
}

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
): Result<
  {
    newChunkSize: number
    newRetryDirection: RetryDirection
    nextIndex: number
    errors: ProcessError[]
    shouldBreak: boolean
  },
  Error
> {
  if (readOffset !== null) {
    const charIndex = utf8ByteOffsetToCharIndex(chunk, readOffset)
    if (charIndex === null) {
      return err(new Error('UnexpectedCondition. charIndex === null'))
    }

    if (charIndex === chunk.length) {
      return ok({
        newChunkSize: adjustedChunkSize,
        newRetryDirection: retryDirection,
        nextIndex: startIndex + adjustedChunkSize,
        errors: [],
        shouldBreak: true,
      })
    }

    const lineNumber = getLineNumber(chunk, charIndex)
    if (lineNumber === null) {
      return err(new Error('UnexpectedCondition. lineNumber === null'))
    }
    return ok({
      newChunkSize: adjustedChunkSize,
      newRetryDirection: retryDirection,
      nextIndex: startIndex + lineNumber,
      errors: [],
      shouldBreak: true,
    })
  }

  return ok({
    newChunkSize: adjustedChunkSize,
    newRetryDirection: retryDirection,
    nextIndex: startIndex + adjustedChunkSize,
    errors: [],
    shouldBreak: true,
  })
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
  chunkOffset: number,
  callback: (
    chunk: string,
    chunkOffset: number,
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
  const [retryOffset, readOffset, errors] = await callback(chunk, chunkOffset)

  // Handle successful processing (no retry needed)
  if (retryOffset === null) {
    const processResult = handleSuccessfulProcessing(
      adjustedChunkSize,
      retryDirection,
      startIndex,
      readOffset,
      chunk,
    )
    if (processResult.isErr()) {
      throw processResult.error
    }
    return processResult.value
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
  chunkOffset: number,
  callback: (
    chunk: string,
    chunkOffset: number,
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
      chunkOffset,
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
    chunkOffset: number,
  ) => Promise<[number | null, number | null, ProcessError[]]>,
): Promise<ProcessError[]> => {
  if (sqlInput === '') return []

  const lines = sqlInput.split('\n')
  const processErrors: ProcessError[] = []
  let runningOffset = 0

  for (let i = 0; i < lines.length; ) {
    // Stop processing if we've encountered errors
    if (processErrors.length > 0) break

    const { newIndex, errors } = await processPosition(
      lines,
      i,
      chunkSize,
      runningOffset,
      callback,
    )

    if (errors.length > 0) {
      processErrors.push(...errors)
      break
    }

    // Update running offset for the next chunk
    for (let j = i; j < newIndex; j++) {
      runningOffset += (lines[j] || '').length + 1 // +1 for newline character
    }

    i = newIndex
  }

  return processErrors
}
