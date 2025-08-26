/**
 * Parse a single argument with value
 */
const parseArgValue = (
  args: string[],
  index: number,
  argName: string,
  shortName: string,
): { value?: string; skip: boolean } => {
  const arg = args[index]
  if (!arg) return { skip: false }

  // Handle --flag=value format
  const longPrefix = `--${argName}=`
  const shortPrefix = `-${shortName}=`

  if (arg.startsWith(longPrefix)) {
    return { value: arg.slice(longPrefix.length), skip: false }
  }
  if (arg.startsWith(shortPrefix)) {
    return { value: arg.slice(shortPrefix.length), skip: false }
  }

  // Handle --flag value format
  if (arg === `--${argName}` || arg === `-${shortName}`) {
    const nextArg = args[index + 1]
    if (nextArg && !nextArg.startsWith('-')) {
      return { value: nextArg, skip: true }
    }
  }

  return { skip: false }
}

/**
 * Parse command line arguments for design process
 */
export const parseDesignProcessArgs = (): {
  prompt?: string
  sessionId?: string
} => {
  const args = process.argv.slice(2)
  const result: { prompt?: string; sessionId?: string } = {}

  for (let i = 0; i < args.length; i++) {
    // Parse prompt
    const promptResult = parseArgValue(args, i, 'prompt', 'p')
    if (promptResult.value !== undefined) {
      result.prompt = promptResult.value
      if (promptResult.skip) i++
      continue
    }

    // Parse session-id
    const sessionResult = parseArgValue(args, i, 'session-id', 's')
    if (sessionResult.value !== undefined) {
      const trimmed = sessionResult.value.trim()
      if (trimmed) {
        result.sessionId = trimmed
      } else {
        console.warn('Invalid session ID provided - ignoring empty value')
      }
      if (sessionResult.skip) i++
    }
  }

  return result
}

/**
 * Parse command line arguments for QA agent (without session-id)
 */
export const parseQaAgentArgs = (): { prompt?: string } => {
  // skip Node exec path and script path, only keep user-provided args
  const args = process.argv.slice(2)
  const result: { prompt?: string } = {}

  for (let i = 0; i < args.length; i++) {
    // Parse prompt
    const promptResult = parseArgValue(args, i, 'prompt', 'p')
    if (promptResult.value !== undefined) {
      result.prompt = promptResult.value
      if (promptResult.skip) i++
    }
  }

  return result
}

/**
 * Check if help flag is present
 */
export const hasHelpFlag = (): boolean => {
  const args = process.argv.slice(2)
  return args.includes('--help') || args.includes('-h')
}
