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
export const processSQLInChunks = async (
  sqlInput: string,
  chunkSize: number,
  callback: (
    chunk: string,
  ) => Promise<[number | null, number | null, ProcessError[]]>,
): Promise<ProcessError[]> => {
  if (sqlInput === '') return []
  const lines = sqlInput.split('\n')
  let currentChunkSize = 0
  const processErrors: ProcessError[] = []

  const retryDirectionValues = {
    decrease: -1, // Shrinking mode
    increase: 1, // Expanding mode
  } as const
  type RetryDirection = -1 | 1

  for (let i = 0; i < lines.length; ) {
    if (processErrors.length > 0) break
    currentChunkSize = chunkSize
    let retryDirection: RetryDirection = retryDirectionValues.decrease

    while (true) {
      // NOTE: To minimize unnecessary retries, avoid increasing currentChunkSize excessively,
      //       especially when retryOffset is present.
      if (retryDirection === retryDirectionValues.decrease) {
        if (i + currentChunkSize > lines.length) {
          currentChunkSize = lines.length - i
        }
      }

      const chunk = lines.slice(i, i + currentChunkSize).join('\n')
      const [retryOffset, readOffset, errors] = await callback(chunk)

      if (retryOffset !== null) {
        if (retryDirection === retryDirectionValues.decrease) {
          currentChunkSize--
          if (currentChunkSize === 0) {
            retryDirection = retryDirectionValues.increase
            currentChunkSize = chunkSize
          }
        } else if (retryDirection === retryDirectionValues.increase) {
          currentChunkSize++
          // NOTE: No further progress can be made in this case, so break.
          if (i + currentChunkSize > lines.length) {
            processErrors.push(...errors)
            break
          }
          // NOTE: Prevent excessive memory usage. If currentChunkSize exceeds twice the original chunkSize, return an error.
          //       The factor of 2 is arbitrary and can be adjusted in the future if necessary.
          if (currentChunkSize > chunkSize * 2) {
            processErrors.push(...errors)
            break
          }
        }
      } else if (readOffset !== null) {
        const lineNumber = getLineNumber(chunk, readOffset)
        if (lineNumber === null) {
          throw new Error('UnexpectedCondition. lineNumber === null')
        }
        i += lineNumber
        break
      } else {
        i += currentChunkSize
        break
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
