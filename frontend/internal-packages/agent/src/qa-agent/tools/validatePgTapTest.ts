export const isPgTapTest = (sql: string): boolean => {
  const lowerSql = sql.toLowerCase()
  return (
    lowerSql.includes('lives_ok(') ||
    lowerSql.includes('throws_ok(') ||
    lowerSql.includes('has_table(') ||
    lowerSql.includes('has_column(') ||
    lowerSql.includes('is(') ||
    lowerSql.includes('ok(')
  )
}

const checkAssertions = (lowerSql: string, errors: string[]): void => {
  const hasAssertion =
    lowerSql.includes('lives_ok(') ||
    lowerSql.includes('throws_ok(') ||
    lowerSql.includes('is(') ||
    lowerSql.includes('ok(') ||
    lowerSql.includes('results_eq(') ||
    lowerSql.includes('has_table(') ||
    lowerSql.includes('has_column(')

  if (!hasAssertion) {
    errors.push(
      'No pgTAP assertions found - test must include at least one assertion (lives_ok, throws_ok, is, ok, etc.)',
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

export const validatePgTapTest = (sql: string): string | undefined => {
  const lowerSql = sql.toLowerCase()
  const errors: string[] = []

  checkAssertions(lowerSql, errors)
  checkSyntaxErrors(sql, errors)

  if (errors.length > 0) {
    return `pgTAP test validation failed:\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\nFix these issues and retry.`
  }

  return undefined
}
