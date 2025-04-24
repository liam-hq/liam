import type { ProcessError } from '../../errors.js'

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
const retryDirectionValues = {
  decrease: -1, // Shrinking mode
  increase: 1, // Expanding mode
} as const
type RetryDirection = -1 | 1

/**
 * Adjusts the chunk size based on the current retry direction
 */
function adjustChunkSize(
  currentChunkSize: number,
  retryDirection: RetryDirection,
  i: number,
  lines: string[]
): number {
  if (retryDirection === retryDirectionValues.decrease) {
    if (i + currentChunkSize > lines.length) {
      return lines.length - i
    }
  }
  return currentChunkSize
}

/**
 * Handles retry logic when a retry offset is encountered
 */
function handleRetry(
  retryDirection: RetryDirection,
  currentChunkSize: number,
  chunkSize: number,
  i: number,
  lines: string[],
  errors: ProcessError[]
): [RetryDirection, number, ProcessError[], boolean] {
  let newChunkSize = currentChunkSize
  let newErrors = [...errors]
  let shouldBreak = false
  
  if (retryDirection === retryDirectionValues.decrease) {
    // Decrease chunk size
    newChunkSize--
    if (newChunkSize === 0) {
      retryDirection = retryDirectionValues.increase
      newChunkSize = chunkSize
    }
  } else if (retryDirection === retryDirectionValues.increase) {
    // Increase chunk size
    newChunkSize++
    
    if (i + newChunkSize > lines.length) {
      newErrors = errors
      shouldBreak = true
    }
    else if (newChunkSize > chunkSize * 2) {
      newErrors = errors
      shouldBreak = true
    }
  }
  
  return [retryDirection, newChunkSize, newErrors, shouldBreak]
}

/**
 * Processes a single chunk of SQL
 */
async function processChunk(
  lines: string[],
  i: number,
  currentChunkSize: number,
  retryDirection: RetryDirection,
  chunkSize: number,
  callback: (chunk: string) => Promise<[number | null, number | null, ProcessError[]]>,
  processErrors: ProcessError[]
): Promise<[number, RetryDirection, ProcessError[]]> {
  const adjustedChunkSize = adjustChunkSize(currentChunkSize, retryDirection, i, lines)
  
  const chunk = lines.slice(i, i + adjustedChunkSize).join('\n')
  const [retryOffset, readOffset, errors] = await callback(chunk)
  
  if (retryOffset !== null) {
    const [newRetryDirection, _, newErrors, shouldBreak] = 
      handleRetry(retryDirection, adjustedChunkSize, chunkSize, i, lines, errors)
    
    if (shouldBreak) {
      processErrors.push(...newErrors)
      return [i, newRetryDirection, processErrors]
    }
    
    return [i, newRetryDirection, processErrors]
  }
  else if (readOffset !== null) {
    const lineNumber = getLineNumber(chunk, readOffset)
    if (lineNumber === null) {
      throw new Error('UnexpectedCondition. lineNumber === null')
    }
    return [i + lineNumber, retryDirection, processErrors]
  } 
  else {
    // Handle complete chunk processing
    return [i + adjustedChunkSize, retryDirection, processErrors]
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
    if (processErrors.length > 0) break
    
    let currentChunkSize = chunkSize
    let retryDirection: RetryDirection = retryDirectionValues.decrease
    
    while (true) {
      const [newPosition, newRetryDirection, newErrors] = await processChunk(
        lines, i, currentChunkSize, retryDirection, chunkSize, callback, processErrors
      )
      
      retryDirection = newRetryDirection
      
      if (newPosition !== i) {
        i = newPosition
        break
      }
      
      if (newErrors.length > processErrors.length) {
        processErrors.push(...newErrors.slice(processErrors.length))
        break
      }
      
      if (retryDirection === retryDirectionValues.decrease) {
        currentChunkSize--
      } else {
        currentChunkSize++
      }
    }
  }
  
  return processErrors
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
