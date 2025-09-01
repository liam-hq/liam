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
    it('should filter out unsupported extensions', async () => {
      const sql = 'SELECT 1;'
      const results = await manager.executeQuery(sql, [
        'unsupported_extension',
        'another_fake_ext',
      ])

      expect(results).toHaveLength(1)
      expect(results[0]?.success).toBe(true)
    })

    it('should handle empty extension array', async () => {
      const sql = 'SELECT 1;'
      const results = await manager.executeQuery(sql, [])

      expect(results).toHaveLength(1)
      expect(results[0]?.success).toBe(true)
      expect(results[0]?.sql.trim()).toBe('SELECT 1')
    })

    it('should normalize extension names (uuid-ossp → uuid_ossp)', async () => {
      const sql = 'SELECT 1;'
      // Test that uuid-ossp gets normalized to uuid_ossp internally
      const results = await manager.executeQuery(sql, ['uuid-ossp'])

      expect(results).toHaveLength(1)
      expect(results[0]?.success).toBe(true)
    })

    it('should handle mixed supported and unsupported extensions', async () => {
      const sql = 'SELECT 1;'
      const results = await manager.executeQuery(sql, [
        'hstore', // supported
        'fake_extension', // unsupported
        'pg_trgm', // supported
        'another_fake', // unsupported
      ])

      expect(results).toHaveLength(1)
      expect(results[0]?.success).toBe(true)
      // Only supported extensions will be loaded, unsupported ones filtered out
    })

    describe('Representative Extension Loading', () => {
      // Representative sample covering different categories
      const representativeExtensions = [
        'live',
        'uuid-ossp', // Contrib with normalization (uuid-ossp → uuid_ossp)
        'hstore',
        'vector',
        'pg_trgm',
        'btree_gin',
      ]

      it.each(representativeExtensions)(
        'should successfully load extension: %s',
        async (extensionName) => {
          const sql = 'SELECT 1;'
          const results = await manager.executeQuery(sql, [extensionName])

          expect(results).toHaveLength(1)
          expect(results[0]?.success).toBe(true)
        },
      )
    })

    describe('CREATE EXTENSION DDL Filtering', () => {
      it('should keep CREATE EXTENSION for supported extensions', async () => {
        const sql = `
          CREATE EXTENSION IF NOT EXISTS hstore;
          CREATE EXTENSION IF NOT EXISTS pg_trgm;
          SELECT 1;
        `
        const results = await manager.executeQuery(sql, ['hstore', 'pg_trgm'])

        // All statements should execute successfully
        expect(results).toHaveLength(3)
        expect(results[0]?.success).toBe(true)
        expect(results[0]?.sql).toContain(
          'CREATE EXTENSION IF NOT EXISTS hstore',
        )
        expect(results[1]?.success).toBe(true)
        expect(results[1]?.sql).toContain(
          'CREATE EXTENSION IF NOT EXISTS pg_trgm',
        )
        expect(results[2]?.success).toBe(true)
      })

      it('should comment out CREATE EXTENSION for unsupported extensions', async () => {
        const sql = `
          CREATE EXTENSION IF NOT EXISTS fake_extension;
          CREATE EXTENSION IF NOT EXISTS another_fake;
          SELECT 1;
        `
        const results = await manager.executeQuery(sql, [])

        // The filtered SQL should contain commented out extensions and the SELECT statement
        expect(results).toHaveLength(1)
        expect(results[0]?.sql).toContain(
          '-- Excluded (not supported in PGlite): CREATE EXTENSION',
        )
        expect(results[0]?.sql).toContain('SELECT 1')
        expect(results[0]?.success).toBe(true)
      })

      it('should handle mixed supported and unsupported extensions in DDL', async () => {
        const sql = `
          CREATE EXTENSION IF NOT EXISTS hstore;
          CREATE EXTENSION IF NOT EXISTS fake_extension;
          CREATE EXTENSION IF NOT EXISTS pg_trgm;
          CREATE EXTENSION IF NOT EXISTS unsupported_ext;
          CREATE TABLE test (id INT);
        `
        const results = await manager.executeQuery(sql, ['hstore', 'pg_trgm'])

        // Should execute: hstore, pg_trgm, CREATE TABLE
        // Should be filtered: fake_extension, unsupported_ext
        expect(results).toHaveLength(3)
        expect(results[0]?.sql).toContain(
          'CREATE EXTENSION IF NOT EXISTS hstore',
        )
        expect(results[1]?.sql).toContain(
          'CREATE EXTENSION IF NOT EXISTS pg_trgm',
        )
        expect(results[2]?.sql).toContain('CREATE TABLE test')
      })

      it('should normalize extension names in DDL (uuid-ossp → uuid_ossp)', async () => {
        const sql = `
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          SELECT uuid_generate_v4();
        `
        const results = await manager.executeQuery(sql, ['uuid-ossp'])

        // Extension should be loaded successfully with normalization
        expect(results).toHaveLength(2)
        expect(results[0]?.success).toBe(true)
        expect(results[0]?.sql).toContain('CREATE EXTENSION')
        expect(results[0]?.sql).toContain('uuid-ossp')
        // The second statement should work if extension loaded correctly
        expect(results[1]?.success).toBe(true)
      })

      it('should handle DDL with quoted and unquoted extension names', async () => {
        const sql = `
          CREATE EXTENSION IF NOT EXISTS "hstore";
          CREATE EXTENSION IF NOT EXISTS pg_trgm;
          CREATE EXTENSION vector;
          SELECT 1;
        `
        const results = await manager.executeQuery(sql, [
          'hstore',
          'pg_trgm',
          'vector',
        ])

        expect(results).toHaveLength(4)
        expect(results[0]?.sql).toContain(
          'CREATE EXTENSION IF NOT EXISTS "hstore"',
        )
        expect(results[1]?.sql).toContain(
          'CREATE EXTENSION IF NOT EXISTS pg_trgm',
        )
        expect(results[2]?.sql).toContain('CREATE EXTENSION vector')
        expect(results[3]?.sql.trim()).toBe('SELECT 1')
      })

      it('should filter extensions not in the provided array even if supported', async () => {
        const sql = `
          CREATE EXTENSION IF NOT EXISTS hstore;
          CREATE EXTENSION IF NOT EXISTS pg_trgm;
          CREATE EXTENSION IF NOT EXISTS vector;
          SELECT 1;
        `
        // Only provide hstore in the extensions array
        const results = await manager.executeQuery(sql, ['hstore'])

        // hstore should execute, pg_trgm and vector should be commented out
        expect(results).toHaveLength(2)
        expect(results[0]?.sql).toContain(
          'CREATE EXTENSION IF NOT EXISTS hstore',
        )
        expect(results[1]?.sql).toContain(
          '-- Excluded (not supported in PGlite): CREATE EXTENSION IF NOT EXISTS pg_trgm',
        )
        expect(results[1]?.sql).toContain(
          '-- Excluded (not supported in PGlite): CREATE EXTENSION IF NOT EXISTS vector',
        )
        expect(results[1]?.sql).toContain('SELECT 1')
      })
    })
  })
})
