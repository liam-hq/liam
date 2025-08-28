import { beforeAll, describe, expect, it } from 'vitest'
import { PGliteInstanceManager } from './PGliteInstanceManager'

describe('PGliteInstanceManager', () => {
  const manager = new PGliteInstanceManager()

  // Warm up the pg-query-emscripten module before tests
  beforeAll(async () => {
    // Execute a simple query to initialize the parser
    await manager.executeQuery('SELECT 1')
  }, 30000)

  it('should handle single statement', async () => {
    const sql = 'SELECT 1;'
    const results = await manager.executeQuery(sql)

    expect(results).toHaveLength(1)
    expect(results[0]?.success).toBe(true)
    expect(results[0]?.sql.trim()).toBe('SELECT 1')
  })

  it('should handle multiple statements', async () => {
    const sql = 'SELECT 1; SELECT 2;'
    const results = await manager.executeQuery(sql)

    expect(results).toHaveLength(2)
    expect(results[0]?.success).toBe(true)
    expect(results[0]?.sql.trim()).toBe('SELECT 1')
    expect(results[1]?.success).toBe(true)
    expect(results[1]?.sql.trim()).toBe('SELECT 2')
  })

  it('should handle dollar-quoted function definitions', async () => {
    const sql = `
      CREATE OR REPLACE FUNCTION hello()
      RETURNS TEXT AS $$
      BEGIN
        RETURN 'Hello, World!';
      END;
      $$ LANGUAGE plpgsql;

      SELECT hello();
    `

    const results = await manager.executeQuery(sql)

    // Should parse into 2 statements: CREATE FUNCTION and SELECT
    expect(results).toHaveLength(2)
    expect(results[0]?.success).toBe(true)
    expect(results[0]?.sql).toContain('CREATE OR REPLACE FUNCTION')
    expect(results[0]?.sql).toContain('$$')
    expect(results[1]?.success).toBe(true)
    expect(results[1]?.sql.trim()).toBe('SELECT hello()')
  })

  it('should handle complex dollar-quoted strings with semicolons inside', async () => {
    const sql = `
      CREATE OR REPLACE FUNCTION complex_function()
      RETURNS TEXT AS $func$
      BEGIN
        EXECUTE 'SELECT 1; SELECT 2;'; -- semicolons inside dollar quotes
        RETURN 'Done; finished;'; -- more semicolons
      END;
      $func$ LANGUAGE plpgsql;
    `

    const results = await manager.executeQuery(sql)

    // Should be parsed as single statement despite internal semicolons
    expect(results).toHaveLength(1)
    expect(results[0]?.sql).toContain('CREATE OR REPLACE FUNCTION')
    expect(results[0]?.sql).toContain('$func$')
    expect(results[0]?.sql).toContain('SELECT 1; SELECT 2;')
  })

  it('should handle mixed dollar-quoted and regular statements', async () => {
    const sql = `
      SELECT 'before function';

      CREATE OR REPLACE FUNCTION test_func()
      RETURNS INTEGER AS $$
      DECLARE
        result INTEGER;
      BEGIN
        result := 42;
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;

      SELECT test_func();
    `

    const results = await manager.executeQuery(sql)

    expect(results).toHaveLength(3)
    expect(results[0]?.sql.trim()).toBe("SELECT 'before function'")
    expect(results[1]?.sql).toContain('CREATE OR REPLACE FUNCTION')
    expect(results[1]?.sql).toContain('$$')
    expect(results[2]?.sql.trim()).toBe('SELECT test_func()')
  })

  it('should fallback to simple splitting on parse errors', async () => {
    // Intentionally malformed SQL to test fallback
    const sql = 'INVALID SQL SYNTAX;;;'
    const results = await manager.executeQuery(sql)

    // Should still attempt to execute (though it will fail)
    expect(results).toHaveLength(1)
    expect(results[0]?.success).toBe(false)
    expect(results[0]?.result).toStrictEqual({
      error: 'Parse error: syntax error at or near "INVALID"',
    })
  })

  describe('Transaction Error Handling', () => {
    it('should FAIL when using explicit BEGIN without proper error handling', async () => {
      // This test demonstrates the actual problem when BEGIN is used
      const manager = new PGliteInstanceManager()

      const sql = `
        CREATE TABLE test_problem (id INT PRIMARY KEY, value TEXT);
        BEGIN;  -- Start explicit transaction
        INSERT INTO test_problem (id, value) VALUES (1, 'first');
        INSERT INTO test_problem (id, value) VALUES (1, 'duplicate'); -- Will fail
        INSERT INTO test_problem (id, value) VALUES (2, 'second'); -- Should work but won't due to transaction abort
        COMMIT; -- Will succeed but transaction was already aborted
        SELECT COUNT(*) FROM test_problem; -- Will show only 0 rows (transaction rolled back)
      `

      const results = await manager.executeQuery(sql)

      const normalizedResults = results.map((r) => ({
        sql: r.sql,
        success: r.success,
        result: r.result,
      }))

      // This test demonstrates the transaction abort problem with explicit BEGIN
      expect(normalizedResults).toStrictEqual([
        {
          sql: 'CREATE TABLE test_problem (id INT PRIMARY KEY, value TEXT)',
          success: true,
          result: { rows: [], fields: [], affectedRows: 0 },
        },
        {
          sql: 'BEGIN',
          success: true,
          result: { rows: [], fields: [], affectedRows: 0 },
        },
        {
          sql: "-- Start explicit transaction\n        INSERT INTO test_problem (id, value) VALUES (1, 'first')",
          success: true,
          result: { rows: [], fields: [], affectedRows: 1 },
        },
        {
          sql: "INSERT INTO test_problem (id, value) VALUES (1, 'duplicate')",
          success: false,
          result: {
            error:
              'duplicate key value violates unique constraint "test_problem_pkey"',
          },
        },
        {
          sql: "-- Will fail\n        INSERT INTO test_problem (id, value) VALUES (2, 'second')",
          success: false,
          result: {
            error:
              'current transaction is aborted, commands ignored until end of transaction block',
          },
        },
        {
          sql: "-- Should work but won't due to transaction abort\n        COMMIT",
          success: true,
          result: { rows: [], fields: [], affectedRows: 0 },
        },
        {
          sql: '-- Will succeed but transaction was already aborted\n        SELECT COUNT(*) FROM test_problem',
          success: true,
          result: {
            rows: [{ count: 0 }], // 0 because the transaction was rolled back
            fields: [{ name: 'count', dataTypeID: 20 }],
            affectedRows: 0,
          },
        },
      ])
    })
  })
})
