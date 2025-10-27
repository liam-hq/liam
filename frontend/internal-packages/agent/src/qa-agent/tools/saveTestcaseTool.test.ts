import { describe, expect, it } from 'vitest'
import { validatePgTapTest } from './validatePgTapTest'
import { validateSqlSyntax } from './validateSqlSyntax'

describe('saveTestcaseTool validation logic', () => {
  describe('pgTAP tests with valid SQL syntax', () => {
    it('should pass both structure and syntax validation for valid pgTAP test', async () => {
      const sql = `
        SELECT lives_ok($$INSERT INTO users (name) VALUES ('Alice')$$, 'Insert user works');
      `

      const structureResult = validatePgTapTest(sql)
      expect(structureResult).toBeUndefined()

      const syntaxResult = await validateSqlSyntax(sql)
      expect(syntaxResult).toBeUndefined()
    })

    it('should pass validation for pgTAP test with multiple assertions', async () => {
      const sql = `
        SELECT lives_ok($$INSERT INTO users (name) VALUES ('Alice')$$, 'Insert user');
        SELECT is((SELECT COUNT(*) FROM users), 1::bigint, 'User count is 1');
      `

      const structureResult = validatePgTapTest(sql)
      expect(structureResult).toBeUndefined()

      const syntaxResult = await validateSqlSyntax(sql)
      expect(syntaxResult).toBeUndefined()
    })

    it('should pass validation for pgTAP test with throws_ok', async () => {
      const sql = `
        SELECT throws_ok($$SELECT 1/0$$, '22012', 'Division by zero throws error');
      `

      const structureResult = validatePgTapTest(sql)
      expect(structureResult).toBeUndefined()

      const syntaxResult = await validateSqlSyntax(sql)
      expect(syntaxResult).toBeUndefined()
    })

    it('should pass validation for pgTAP test with has_table', async () => {
      const sql = `
        SELECT has_table('users', 'Users table exists');
      `

      const structureResult = validatePgTapTest(sql)
      expect(structureResult).toBeUndefined()

      const syntaxResult = await validateSqlSyntax(sql)
      expect(syntaxResult).toBeUndefined()
    })
  })

  describe('pgTAP tests with invalid outer SQL syntax', () => {
    it('should detect SQL syntax error in outer SELECT statement', async () => {
      const sql = `
        SELCT lives_ok($$INSERT INTO users (name) VALUES ('Alice')$$, 'Insert user');
      `

      const structureResult = validatePgTapTest(sql)
      expect(structureResult).toBeUndefined()

      const syntaxResult = await validateSqlSyntax(sql)
      expect(syntaxResult).toBeDefined()
      expect(syntaxResult).toContain('SQL syntax error')
    })

    it('should detect missing SELECT keyword', async () => {
      const sql = `
        lives_ok($$INSERT INTO users (name) VALUES ('Alice')$$, 'Insert user');
      `

      const structureResult = validatePgTapTest(sql)
      expect(structureResult).toBeUndefined()

      const syntaxResult = await validateSqlSyntax(sql)
      expect(syntaxResult).toBeDefined()
      expect(syntaxResult).toContain('SQL syntax error')
    })

    it('should detect completely malformed SQL with pgTAP function', async () => {
      const sql = `
        INVALID SYNTAX lives_ok($$INSERT INTO users (name) VALUES ('Alice')$$);
      `

      const structureResult = validatePgTapTest(sql)
      expect(structureResult).toBeUndefined()

      const syntaxResult = await validateSqlSyntax(sql)
      expect(syntaxResult).toBeDefined()
      expect(syntaxResult).toContain('SQL syntax error')
    })
  })

  describe('pgTAP structure errors with valid SQL', () => {
    it('should detect missing assertions before checking SQL syntax', async () => {
      const sql = `
        SELECT 1;
        SELECT 2;
      `

      const structureResult = validatePgTapTest(sql)
      expect(structureResult).toBeDefined()
      expect(structureResult).toContain('No pgTAP assertions found')
    })

    it('should detect structure error even with valid SQL syntax', async () => {
      const sql = `
        SELECT * FROM users;
        INSERT INTO users (name) VALUES ('Alice');
      `

      const structureResult = validatePgTapTest(sql)
      expect(structureResult).toBeDefined()
      expect(structureResult).toContain('No pgTAP assertions found')

      const syntaxResult = await validateSqlSyntax(sql)
      expect(syntaxResult).toBeUndefined()
    })
  })

  describe('regular SQL (non-pgTAP)', () => {
    it('should only run syntax validation for regular SQL', async () => {
      const sql = 'SELECT * FROM users;'

      const syntaxResult = await validateSqlSyntax(sql)
      expect(syntaxResult).toBeUndefined()
    })

    it('should detect syntax errors in regular SQL', async () => {
      const sql = 'SELECT * FORM users;'

      const syntaxResult = await validateSqlSyntax(sql)
      expect(syntaxResult).toBeDefined()
      expect(syntaxResult).toContain('SQL syntax error')
    })
  })
})
