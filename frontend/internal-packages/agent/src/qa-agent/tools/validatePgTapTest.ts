/**
 * Check if SQL contains pgTAP test code
 */
export const isPgTapTest = (sql: string): boolean => {
  const lowerSql = sql.toLowerCase()
  // Check for pgTAP-specific functions
  return (
    lowerSql.includes('plan(') ||
    lowerSql.includes('finish()') ||
    lowerSql.includes('lives_ok(') ||
    lowerSql.includes('throws_ok(') ||
    lowerSql.includes('has_table(') ||
    lowerSql.includes('has_column(')
  )
}

/**
 * Validate pgTAP test structure and return error message if validation fails
 *
 * @returns Error message string if validation fails, undefined if validation succeeds
 */
export const validatePgTapTest = (sql: string): string | undefined => {
  const lowerSql = sql.toLowerCase()
  const errors: string[] = []

  // Check for plan()
  const planMatches = lowerSql.match(/plan\(/g)
  if (!planMatches || planMatches.length === 0) {
    errors.push(
      'Missing plan() declaration - pgTAP tests must declare the number of tests',
    )
  } else if (planMatches.length > 1) {
    errors.push(
      'Multiple plan() declarations found - pgTAP tests must have exactly one plan() call',
    )
  }

  // Check for finish()
  if (!lowerSql.includes('finish()')) {
    errors.push(
      'Missing finish() call - pgTAP tests must call finish() at the end',
    )
  }

  // Check for at least one assertion
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

  if (errors.length > 0) {
    return `pgTAP test validation failed:\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\nFix these issues and retry.`
  }

  return undefined
}
