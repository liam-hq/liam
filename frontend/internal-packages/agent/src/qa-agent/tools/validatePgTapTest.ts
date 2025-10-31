import { err, ok, type Result } from '@liam-hq/neverthrow'

const PGTAP_FUNCTIONS = [
  'lives_ok',
  'throws_ok',
  'is',
  'ok',
  'results_eq',
  'bag_eq',
] as const

export const isPgTapTest = (sql: string): boolean => {
  const lowerSql = sql.toLowerCase()
  return PGTAP_FUNCTIONS.some((fnName) => lowerSql.includes(`${fnName}(`))
}

const checkAssertions = (lowerSql: string, errors: string[]): void => {
  const hasAssertion = PGTAP_FUNCTIONS.some((fnName) =>
    lowerSql.includes(`${fnName}(`),
  )

  if (!hasAssertion) {
    const functionList = PGTAP_FUNCTIONS.slice(0, 4).join(', ')
    errors.push(
      `No pgTAP assertions found - test must include at least one assertion (${functionList}, etc.)`,
    )
  }
}

const checkSyntaxErrors = (sql: string, errors: string[]): void => {
  if (sql.match(/[;]\s*\)/)) {
    errors.push(
      'Semicolon before closing parenthesis detected - remove semicolons before ) in pgTAP function calls',
    )
  }
}

export const validatePgTapTest = (sql: string): Result<void, string> => {
  if (!isPgTapTest(sql)) {
    return ok(undefined)
  }

  const lowerSql = sql.toLowerCase()
  const errors: string[] = []

  checkAssertions(lowerSql, errors)
  checkSyntaxErrors(sql, errors)

  if (errors.length > 0) {
    return err(
      `pgTAP test validation failed:\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\nFix these issues and retry.`,
    )
  }

  return ok(undefined)
}
