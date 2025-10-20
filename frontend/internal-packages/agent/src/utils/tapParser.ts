/**
 * TAP (Test Anything Protocol) v13 parser
 *
 * Parses TAP output from pgTAP tests and extracts test results,
 * diagnostics, and summary information.
 *
 * @see https://testanything.org/tap-version-13-specification.html
 */

export type TapTestResult = {
  ok: boolean
  testNumber: number
  description: string
  directive?: 'TODO' | 'SKIP' | undefined
  directiveReason?: string | undefined
  diagnostics?: Record<string, unknown> | undefined
}

export type TapSummary = {
  plan: {
    start: number
    end: number
  } | null
  tests: TapTestResult[]
  total: number
  passed: number
  failed: number
  skipped: number
  todo: number
}

/**
 * Parse TAP output into structured test results
 *
 * @param output - Raw TAP output string
 * @returns Parsed TAP summary with test results
 *
 * @example
 * ```typescript
 * const output = `
 * 1..3
 * ok 1 - Valid reservation should succeed
 * not ok 2 - Invalid product_id should fail
 * ok 3 - Should find user
 * `;
 * const result = parseTapOutput(output);
 * console.log(result.passed); // 2
 * console.log(result.failed); // 1
 * ```
 */
export const parseTapOutput = (output: string): TapSummary => {
  const lines = output.split('\n')
  const tests: TapTestResult[] = []
  let plan: { start: number; end: number } | null = null
  let currentTest: TapTestResult | null = null
  let inYamlBlock = false
  let yamlLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    const trimmedLine = line.trim()

    // Skip empty lines
    if (!trimmedLine) {
      continue
    }

    // Parse plan line (e.g., "1..10")
    if (trimmedLine.match(/^\d+\.\.\d+$/)) {
      const parts = trimmedLine.split('..').map(Number)
      const start = parts[0]
      const end = parts[1]
      if (start !== undefined && end !== undefined) {
        plan = { start, end }
      }
      continue
    }

    // Parse test result line (e.g., "ok 1 - description" or "not ok 2 - description")
    const testMatch = trimmedLine.match(
      /^(not )?ok\s+(\d+)\s*-?\s*(.*)$/i,
    )
    if (testMatch) {
      // Save previous test if exists
      if (currentTest && inYamlBlock) {
        currentTest.diagnostics = parseYamlBlock(yamlLines)
        inYamlBlock = false
        yamlLines = []
      }
      if (currentTest) {
        tests.push(currentTest)
      }

      const notOk = testMatch[1]
      const testNumber = testMatch[2]
      const rest = testMatch[3]
      if (!testNumber) continue

      const ok = !notOk

      // Parse directive (TODO/SKIP) and description
      const directiveMatch = rest?.match(/^(.*?)\s*#\s*(TODO|SKIP)\s*(.*)$/i)
      if (directiveMatch) {
        const description = directiveMatch[1]
        const directive = directiveMatch[2]
        const reason = directiveMatch[3]
        currentTest = {
          ok,
          testNumber: Number(testNumber),
          description: description?.trim() ?? '',
          directive: directive?.toUpperCase() as 'TODO' | 'SKIP',
          directiveReason: reason?.trim() || undefined,
        }
      } else {
        currentTest = {
          ok,
          testNumber: Number(testNumber),
          description: rest?.trim() ?? '',
        }
      }
      continue
    }

    // Parse YAML diagnostic block
    if (trimmedLine === '---') {
      inYamlBlock = true
      yamlLines = []
      continue
    }

    if (trimmedLine === '...') {
      if (currentTest) {
        currentTest.diagnostics = parseYamlBlock(yamlLines)
      }
      inYamlBlock = false
      yamlLines = []
      continue
    }

    // Collect YAML lines
    if (inYamlBlock) {
      yamlLines.push(line)
      continue
    }

    // Handle diagnostic lines (lines starting with #)
    if (trimmedLine.startsWith('#')) {
      const diagnosticText = trimmedLine.slice(1).trim()
      if (currentTest && diagnosticText) {
        if (!currentTest.diagnostics) {
          currentTest.diagnostics = {}
        }
        // Store as a comment
        const diagnostics = currentTest.diagnostics
        if (!diagnostics['comments']) {
          diagnostics['comments'] = []
        }
        const comments = diagnostics['comments']
        if (Array.isArray(comments)) {
          comments.push(diagnosticText)
        }
      }
    }
  }

  // Save last test
  if (currentTest) {
    if (inYamlBlock) {
      currentTest.diagnostics = parseYamlBlock(yamlLines)
    }
    tests.push(currentTest)
  }

  // Calculate summary
  const passed = tests.filter(
    (t) => t.ok && t.directive !== 'SKIP' && t.directive !== 'TODO',
  ).length
  const failed = tests.filter(
    (t) => !t.ok && t.directive !== 'SKIP' && t.directive !== 'TODO',
  ).length
  const skipped = tests.filter((t) => t.directive === 'SKIP').length
  const todo = tests.filter((t) => t.directive === 'TODO').length

  return {
    plan,
    tests,
    total: tests.length,
    passed,
    failed,
    skipped,
    todo,
  }
}

/**
 * Parse YAML diagnostic block into a structured object
 *
 * Handles simple YAML structures commonly found in TAP diagnostics.
 * Does not support complex YAML features like anchors or references.
 *
 * @param lines - Array of YAML lines (without --- and ... markers)
 * @returns Parsed object
 */
const parseYamlBlock = (lines: string[]): Record<string, unknown> => {
  const result: Record<string, unknown> = {}
  let currentKey: string | null = null
  let currentValue: string[] = []

  const flushCurrentValue = () => {
    if (currentKey) {
      const value = currentValue.join('\n').trim()
      // Try to parse as JSON/number/boolean
      try {
        result[currentKey] = JSON.parse(value)
      } catch {
        result[currentKey] = value
      }
      currentKey = null
      currentValue = []
    }
  }

  for (const line of lines) {
    // Match key-value pairs (key: value)
    const keyValueMatch = line.match(/^\s*([^:]+):\s*(.*)$/)
    if (keyValueMatch) {
      flushCurrentValue()
      const key = keyValueMatch[1]
      const value = keyValueMatch[2]
      if (key) {
        currentKey = key.trim()
        currentValue = [value ?? '']
      }
      continue
    }

    // Continuation of previous value
    if (currentKey) {
      currentValue.push(line)
    }
  }

  flushCurrentValue()

  return result
}
