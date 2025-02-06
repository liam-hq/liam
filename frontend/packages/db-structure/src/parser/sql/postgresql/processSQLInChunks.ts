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
  const dollarQuote = '$$'
  // Even though the parser can handle "--", we remove such lines for ease of splitting by semicolons.
  const lines = input.split('\n').filter((line) => !line.startsWith('--'))

  let partialStmt = ''
  let inDollarQuote = false

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize).join('\n')
    const combined = partialStmt + chunk

    if (!inDollarQuote && combined.includes(dollarQuote)) {
      const startIndex = combined.indexOf(dollarQuote)
      if (startIndex !== -1) {
        inDollarQuote = true
        partialStmt = combined
        continue
      }
    }

    if (inDollarQuote) {
      let pos = 0
      let openQuotePos = -1
      let closeQuotePos = -1

      while (true) {
        pos = combined.indexOf(dollarQuote, pos)
        if (pos === -1) break

        if (openQuotePos === -1) {
          openQuotePos = pos
        } else {
          closeQuotePos = pos
          break
        }
        pos += dollarQuote.length
      }

      if (closeQuotePos === -1) {
        partialStmt = combined
        continue
      }

      const semicolonIndex = combined.indexOf(semicolon, closeQuotePos)
      if (semicolonIndex !== -1) {
        await callback(combined.slice(0, semicolonIndex + 1))
        partialStmt = combined.slice(semicolonIndex + 1)
        inDollarQuote = false
      } else {
        partialStmt = combined
      }
      continue
    }

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
