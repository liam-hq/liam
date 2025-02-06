/**
 * Processes a large SQL input string in chunks, ensuring that each chunk ends with a complete SQL statement.
 *
 * @param input - The large SQL input string to be processed.
 * @param chunkSize - The number of lines to include in each chunk.
 * @param callback - An asynchronous callback function to process each chunk of SQL statements.
 */
export const processSQLInChunks = async (
  input: string,
  chunkSize: number,
  callback: (chunk: string) => Promise<void>,
): Promise<void> => {
  const semicolon = ';'

  // Even though the parser can handle comments,
  // we remove such lines for ease of splitting by semicolons.
  const processedInput = input.replace(/\/\*[\s\S]*?\*\//g, '')
  const lines = processedInput
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))

  let partialStmt = ''

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize).join('\n')
    const combined = partialStmt + chunk

    const lastSemicolonIndex = combined.lastIndexOf(semicolon)
    if (lastSemicolonIndex === -1) {
      partialStmt = combined
      continue
    }

    const parseablePart = combined.slice(0, lastSemicolonIndex + 1)
    partialStmt = combined.slice(lastSemicolonIndex + 1)
    await callback(parseablePart)
  }

  // Process the last remaining statement.
  if (partialStmt.trim()) {
    await callback(partialStmt)
  }
}
