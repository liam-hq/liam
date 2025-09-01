import { beforeAll, describe, expect, it } from 'vitest'
import { PGliteInstanceManager } from './PGliteInstanceManager'

describe('PGliteInstanceManager', () => {
  const manager = new PGliteInstanceManager()

  // Warm up the pg-query-emscripten module before tests
  beforeAll(async () => {
    // Execute a simple query to initialize the parser
    await manager.executeQuery('SELECT 1', [])
  }, 30000)

  it('should handle single statement', async () => {
    const sql = 'SELECT 1;'
    const results = await manager.executeQuery(sql, [])

    expect(results).toHaveLength(1)
    expect(results[0]?.success).toBe(true)
    expect(results[0]?.sql.trim()).toBe('SELECT 1')
  })

  it('should handle multiple statements', async () => {
    const sql = 'SELECT 1; SELECT 2;'
    const results = await manager.executeQuery(sql, [])

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

    const results = await manager.executeQuery(sql, [])

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

    const results = await manager.executeQuery(sql, [])

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

    const results = await manager.executeQuery(sql, [])

    expect(results).toHaveLength(3)
    expect(results[0]?.sql.trim()).toBe("SELECT 'before function'")
    expect(results[1]?.sql).toContain('CREATE OR REPLACE FUNCTION')
    expect(results[1]?.sql).toContain('$$')
    expect(results[2]?.sql.trim()).toBe('SELECT test_func()')
  })

  it('should fallback to simple splitting on parse errors', async () => {
    // Intentionally malformed SQL to test fallback
    const sql = 'INVALID SQL SYNTAX;;;'
    const results = await manager.executeQuery(sql, [])

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

      const results = await manager.executeQuery(sql, [])

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

  describe('Extension Support', () => {
    it('should handle basic extension loading scenarios', async () => {
      // Test multiple scenarios in one test to reduce redundancy

      // 1. Empty extensions
      let results = await manager.executeQuery('SELECT 1;', [])
      expect(results).toHaveLength(1)
      expect(results[0]?.success).toBe(true)

      // 2. Supported extensions (including normalization)
      results = await manager.executeQuery('SELECT 1;', ['uuid-ossp', 'hstore'])
      expect(results).toHaveLength(1)
      expect(results[0]?.success).toBe(true)

      // 3. Mixed supported/unsupported extensions
      results = await manager.executeQuery('SELECT 1;', [
        'hstore',
        'fake_extension',
        'pg_trgm',
        'unsupported',
      ])
      expect(results).toHaveLength(1)
      expect(results[0]?.success).toBe(true)
    })

    it('should load representative extensions successfully', async () => {
      const extensions = ['live', 'uuid-ossp', 'hstore', 'vector', 'pg_trgm']

      for (const ext of extensions) {
        const results = await manager.executeQuery('SELECT 1;', [ext])
        expect(results).toHaveLength(1)
        expect(results[0]?.success).toBe(true)
      }
    })

    describe('CREATE EXTENSION DDL Filtering', () => {
      it('should handle supported and unsupported extensions in DDL', async () => {
        const sql = `
          CREATE EXTENSION IF NOT EXISTS hstore;
          CREATE EXTENSION IF NOT EXISTS fake_extension;
          CREATE EXTENSION IF NOT EXISTS pg_trgm;
          SELECT 1;
        `
        const results = await manager.executeQuery(sql, ['hstore', 'pg_trgm'])

        // Should execute: hstore, pg_trgm, SELECT
        // fake_extension should be filtered out
        expect(results).toHaveLength(3)
        expect(results[0]?.sql).toContain(
          'CREATE EXTENSION IF NOT EXISTS hstore',
        )
        expect(results[1]?.sql).toContain(
          'CREATE EXTENSION IF NOT EXISTS pg_trgm',
        )
        expect(results[2]?.sql.trim()).toBe('SELECT 1')
      })

      it('should comment out all unsupported extensions', async () => {
        const sql = `
          CREATE EXTENSION IF NOT EXISTS fake_extension;
          CREATE EXTENSION IF NOT EXISTS another_fake;
          SELECT 1;
        `
        const results = await manager.executeQuery(sql, [])

        expect(results).toHaveLength(1)
        expect(results[0]?.sql).toContain(
          '-- Excluded (not supported in PGlite):',
        )
        expect(results[0]?.sql).toContain('-- CREATE EXTENSION')
        expect(results[0]?.sql).toContain('SELECT 1')
        expect(results[0]?.success).toBe(true)
      })

      it('should handle quoted extension names and normalization', async () => {
        const sql = `
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          CREATE EXTENSION IF NOT EXISTS "hstore";
          CREATE EXTENSION pg_trgm;
        `
        const results = await manager.executeQuery(sql, [
          'uuid-ossp',
          'hstore',
          'pg_trgm',
        ])

        expect(results).toHaveLength(3)
        expect(results[0]?.sql).toContain('uuid-ossp')
        expect(results[1]?.sql).toContain('"hstore"')
        expect(results[2]?.sql).toContain('pg_trgm')
      })

      it('should handle complex CREATE EXTENSION statements with WITH clauses', async () => {
        // This test verifies that the regex can properly handle WITH, SCHEMA, VERSION, CASCADE clauses
        const sql = `
          CREATE EXTENSION IF NOT EXISTS pg_ivm
            WITH VERSION '1.9'
            SCHEMA public
            CASCADE;
          CREATE EXTENSION fake_complex
            WITH VERSION '2.0'
            SCHEMA test;
          SELECT 1;
        `
        const results = await manager.executeQuery(sql, ['pg_ivm'])

        // With the improved regex, the SQL should be parsed correctly
        // The pg_ivm extension is supported, so it should execute
        // The fake_complex extension should be commented out
        // The SELECT 1 should execute successfully
        expect(results).toHaveLength(2) // CREATE EXTENSION pg_ivm and SELECT 1

        // First result: CREATE EXTENSION pg_ivm (should succeed)
        expect(results[0]?.sql).toContain(
          'CREATE EXTENSION IF NOT EXISTS pg_ivm',
        )
        expect(results[0]?.sql).toContain('WITH VERSION')
        expect(results[0]?.sql).toContain('SCHEMA public')
        expect(results[0]?.sql).toContain('CASCADE')
        expect(results[0]?.success).toBe(true)

        // Second result: Comments + SELECT 1 (should succeed)
        expect(results[1]?.sql).toContain('SELECT 1')
        expect(results[1]?.sql).toContain(
          '-- Excluded (not supported in PGlite)',
        )
        expect(results[1]?.success).toBe(true)
      })
    })
  })
})
