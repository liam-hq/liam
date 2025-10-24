import { describe, expect, it } from 'vitest'
import { validateSqlSyntax } from './validateSqlSyntax'

describe('validateSqlSyntax', () => {
  it('returns undefined when SQL syntax is valid', async () => {
    const sql = 'SELECT * FROM users;'

    const result = await validateSqlSyntax(sql)
    expect(result).toBeUndefined()
  })

  it('returns error message when SQL syntax is invalid', async () => {
    const sql = 'SELECT * FORM users;' // intentional typo: "FORM" instead of "FROM"

    const result = await validateSqlSyntax(sql)

    expect(result).toBeDefined()
    expect(result).toContain('SQL syntax error')
    expect(result).toContain('Fix the SQL and retry')
  })

  it('returns error message for completely invalid SQL', async () => {
    const sql = 'INVALID SQL STATEMENT'

    const result = await validateSqlSyntax(sql)

    expect(result).toBeDefined()
    expect(result).toContain('SQL syntax error')
    expect(result).toContain('Fix the SQL and retry')
  })
})
