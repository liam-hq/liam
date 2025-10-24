/**
 * TAP (Test Anything Protocol) v13 parser
 * @see https://testanything.org/tap-version-13-specification.html
 */

import { fromThrowable } from '@liam-hq/neverthrow'

export type TapDirective = 'TODO' | 'SKIP'

const isTapDirective = (value: string): value is TapDirective => {
  const upper = value.toUpperCase()
  return upper === 'TODO' || upper === 'SKIP'
}

const safeJsonParse = fromThrowable(JSON.parse)

export type TapTestResult = {
  ok: boolean
  testNumber: number
  description: string
  directive?: TapDirective | undefined
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

const parsePlanLine = (line: string): { start: number; end: number } | null => {
  if (!line.match(/^\d+\.\.\d+$/)) return null

  const parts = line.split('..').map(Number)
  const start = parts[0]
  const end = parts[1]

  if (start === undefined || end === undefined) return null
  return { start, end }
}

const parseTestLine = (
  line: string,
): { ok: boolean; testNumber: number; rest: string } | null => {
  const testMatch = line.match(/^(not )?ok\s+(\d+)\s*-?\s*(.*)$/i)
  if (!testMatch) return null

  const notOk = testMatch[1]
  const testNumber = testMatch[2]
  const rest = testMatch[3]
  if (!testNumber) return null

  return {
    ok: !notOk,
    testNumber: Number(testNumber),
    rest: rest ?? '',
  }
}

const parseDirective = (
  rest: string,
): {
  description: string
  directive?: TapDirective
  directiveReason?: string
} => {
  const directiveMatch = rest.match(/^(.*?)\s*#\s*(TODO|SKIP)\s*(.*)$/i)
  if (!directiveMatch) {
    return { description: rest.trim() }
  }

  const description = directiveMatch[1]
  const directiveStr = directiveMatch[2]
  const reason = directiveMatch[3]
  const upper = directiveStr?.toUpperCase()
  const directive = upper && isTapDirective(upper) ? upper : undefined

  const result: {
    description: string
    directive?: TapDirective
    directiveReason?: string
  } = {
    description: description?.trim() ?? '',
  }

  if (directive) {
    result.directive = directive
  }

  const trimmedReason = reason?.trim()
  if (trimmedReason) {
    result.directiveReason = trimmedReason
  }

  return result
}

const addDiagnosticComment = (test: TapTestResult, comment: string): void => {
  if (!test.diagnostics) {
    test.diagnostics = {}
  }
  if (!test.diagnostics['comments']) {
    test.diagnostics['comments'] = []
  }
  const comments = test.diagnostics['comments']
  if (Array.isArray(comments)) {
    comments.push(comment)
  }
}

const calculateSummary = (
  tests: TapTestResult[],
): {
  passed: number
  failed: number
  skipped: number
  todo: number
} => {
  const passed = tests.filter(
    (t) => t.ok && t.directive !== 'SKIP' && t.directive !== 'TODO',
  ).length
  const failed = tests.filter(
    (t) => !t.ok && t.directive !== 'SKIP' && t.directive !== 'TODO',
  ).length
  const skipped = tests.filter((t) => t.directive === 'SKIP').length
  const todo = tests.filter((t) => t.directive === 'TODO').length

  return { passed, failed, skipped, todo }
}

const handleYamlBlock = (
  trimmedLine: string,
  line: string,
  state: {
    inYamlBlock: boolean
    yamlLines: string[]
    currentTest: TapTestResult | null
  },
): boolean => {
  if (trimmedLine === '---') {
    state.inYamlBlock = true
    state.yamlLines = []
    return true
  }

  if (trimmedLine === '...') {
    if (state.currentTest) {
      state.currentTest.diagnostics = parseYamlBlock(state.yamlLines)
    }
    state.inYamlBlock = false
    state.yamlLines = []
    return true
  }

  if (state.inYamlBlock) {
    state.yamlLines.push(line)
    return true
  }

  return false
}

const saveAndStartNewTest = (
  state: {
    currentTest: TapTestResult | null
    inYamlBlock: boolean
    yamlLines: string[]
    tests: TapTestResult[]
  },
  newTest: TapTestResult,
): void => {
  if (state.currentTest) {
    if (state.inYamlBlock) {
      state.currentTest.diagnostics = parseYamlBlock(state.yamlLines)
      state.inYamlBlock = false
      state.yamlLines = []
    }
    state.tests.push(state.currentTest)
  }

  state.currentTest = newTest
}

type ParserState = {
  tests: TapTestResult[]
  plan: { start: number; end: number } | null
  currentTest: TapTestResult | null
  inYamlBlock: boolean
  yamlLines: string[]
}

const processLine = (
  line: string,
  trimmedLine: string,
  state: ParserState,
): void => {
  const planResult = parsePlanLine(trimmedLine)
  if (planResult) {
    state.plan = planResult
    return
  }

  const testResult = parseTestLine(trimmedLine)
  if (testResult) {
    const { ok, testNumber, rest } = testResult
    const { description, directive, directiveReason } = parseDirective(rest)

    saveAndStartNewTest(state, {
      ok,
      testNumber,
      description,
      directive,
      directiveReason,
    })
    return
  }

  if (handleYamlBlock(trimmedLine, line, state)) {
    return
  }

  if (trimmedLine.startsWith('#')) {
    const diagnosticText = trimmedLine.slice(1).trim()
    if (state.currentTest && diagnosticText) {
      addDiagnosticComment(state.currentTest, diagnosticText)
    }
  }
}

export const parseTapOutput = (output: string): TapSummary => {
  const lines = output.split('\n')
  const state: ParserState = {
    tests: [],
    plan: null,
    currentTest: null,
    inYamlBlock: false,
    yamlLines: [],
  }

  for (const line of lines) {
    if (!line) continue

    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    processLine(line, trimmedLine, state)
  }

  if (state.currentTest) {
    if (state.inYamlBlock) {
      state.currentTest.diagnostics = parseYamlBlock(state.yamlLines)
    }
    state.tests.push(state.currentTest)
  }

  const summary = calculateSummary(state.tests)

  return {
    plan: state.plan,
    tests: state.tests,
    total: state.tests.length,
    ...summary,
  }
}

const parseYamlBlock = (lines: string[]): Record<string, unknown> => {
  const result: Record<string, unknown> = {}
  let currentKey: string | null = null
  let currentValue: string[] = []

  const flushCurrentValue = () => {
    if (currentKey) {
      const value = currentValue.join('\n').trim()
      const parseResult = safeJsonParse(value)
      result[currentKey] = parseResult.isOk() ? parseResult.value : value
      currentKey = null
      currentValue = []
    }
  }

  for (const line of lines) {
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

    if (currentKey) {
      currentValue.push(line)
    }
  }

  flushCurrentValue()

  return result
}
