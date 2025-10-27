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

  describe('pgTAP syntax compatibility', () => {
    it('can parse pgTAP lives_ok with dollar quotes', async () => {
      const sql = `SELECT lives_ok($$SELECT 1$$, 'Basic query works');`

      const result = await validateSqlSyntax(sql)
      expect(result).toBeUndefined()
    })

    it('can parse multiple pgTAP assertions', async () => {
      const sql = `
        SELECT lives_ok($$INSERT INTO users (name) VALUES ('test')$$, 'Insert user');
        SELECT is((SELECT COUNT(*) FROM users), 1::bigint, 'User count is 1');
      `

      const result = await validateSqlSyntax(sql)
      expect(result).toBeUndefined()
    })

    it('cannot detect syntax errors inside dollar-quoted strings (parser limitation)', async () => {
      const sql = `SELECT lives_ok($$SELECT * FORM users$$, 'test with typo');`

      const result = await validateSqlSyntax(sql)
      expect(result).toBeUndefined()
    })

    it('detects syntax errors in pgTAP outer structure', async () => {
      const sql = `SELECT lives_ok($$SELECT 1$$, 'test';`

      const result = await validateSqlSyntax(sql)

      expect(result).toBeDefined()
      expect(result).toContain('SQL syntax error')
    })
  })
})
