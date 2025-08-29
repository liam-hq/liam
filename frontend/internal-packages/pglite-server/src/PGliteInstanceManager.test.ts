import { beforeAll, describe, expect, it } from 'vitest'
import { PGliteInstanceManager } from './PGliteInstanceManager'
import type { SqlResult } from './types'

// Type guard helpers for query results
function hasRows(result: unknown): result is { rows: unknown[] } {
  return typeof result === 'object' && result !== null && 'rows' in result
}

function hasUuidWorksField(row: unknown): row is { uuid_works: boolean } {
  return typeof row === 'object' && row !== null && 'uuid_works' in row
}

function hasSimpleQueryField(row: unknown): row is { simple_query: number } {
  return typeof row === 'object' && row !== null && 'simple_query' in row
}

function hasUserFields(row: unknown): row is { id: string; name: string } {
  return typeof row === 'object' && row !== null && 'id' in row && 'name' in row
}

// Helper functions for improved test readability
function expectSuccessfulQuery(
  result: SqlResult | undefined,
  expectedSqlFragment?: string,
) {
  expect(result?.success).toBe(true)
  if (expectedSqlFragment) {
    expect(result?.sql).toContain(expectedSqlFragment)
  }
}

function expectUuidFunctionWorks(result: SqlResult | undefined) {
  if (hasRows(result?.result) && hasUuidWorksField(result.result.rows[0])) {
    expect(result.result.rows[0].uuid_works).toBe(true)
  } else {
    expect.fail('Expected result to have rows with uuid_works field')
  }
}

function expectSimpleQueryResult(
  result: SqlResult | undefined,
  expectedValue: number,
) {
  if (hasRows(result?.result) && hasSimpleQueryField(result.result.rows[0])) {
    expect(result.result.rows[0].simple_query).toBe(expectedValue)
  } else {
    expect.fail('Expected result to have rows with simple_query field')
  }
}

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

    const [selectResult] = results
    expect(selectResult?.success).toBe(true)
    expect(selectResult?.sql.trim()).toBe('SELECT 1')
  })

  it('should handle multiple statements', async () => {
    const sql = 'SELECT 1; SELECT 2;'
    const results = await manager.executeQuery(sql)

    expect(results).toHaveLength(2)

    const [firstSelect, secondSelect] = results
    expect(firstSelect?.success).toBe(true)
    expect(firstSelect?.sql.trim()).toBe('SELECT 1')
    expect(secondSelect?.success).toBe(true)
    expect(secondSelect?.sql.trim()).toBe('SELECT 2')
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

    const [createFunctionResult, callFunctionResult] = results
    expectSuccessfulQuery(createFunctionResult, 'CREATE OR REPLACE FUNCTION')
    expect(createFunctionResult?.sql).toContain('$$')
    expectSuccessfulQuery(callFunctionResult)
    expect(callFunctionResult?.sql.trim()).toBe('SELECT hello()')
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

    const [complexFunctionResult] = results
    expectSuccessfulQuery(complexFunctionResult, 'CREATE OR REPLACE FUNCTION')
    expect(complexFunctionResult?.sql).toContain('$func$')
    expect(complexFunctionResult?.sql).toContain('SELECT 1; SELECT 2;')
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

    const [beforeSelect, createFunction, afterSelect] = results
    expect(beforeSelect?.sql.trim()).toBe("SELECT 'before function'")
    expectSuccessfulQuery(createFunction, 'CREATE OR REPLACE FUNCTION')
    expect(createFunction?.sql).toContain('$$')
    expect(afterSelect?.sql.trim()).toBe('SELECT test_func()')
  })

  it('should fallback to simple splitting on parse errors', async () => {
    // Intentionally malformed SQL to test fallback
    const sql = 'INVALID SQL SYNTAX;;;'
    const results = await manager.executeQuery(sql)

    // Should still attempt to execute (though it will fail)
    expect(results).toHaveLength(1)

    const [parseErrorResult] = results
    expect(parseErrorResult?.success).toBe(false)
    expect(parseErrorResult?.result).toStrictEqual({
      error: 'Parse error: syntax error at or near "INVALID"',
    })
  })

  describe('Extension Support', () => {
    it('should handle CREATE EXTENSION statements with pre-loaded extensions', async () => {
      // Test that CREATE EXTENSION works when extensions are pre-loaded via JavaScript
      const sql = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        SELECT uuid_generate_v4() IS NOT NULL as uuid_works;
      `

      const results = await manager.executeQuery(sql, {
        extensions: ['uuid-ossp'],
      })

      expect(results).toHaveLength(2)

      // First statement: CREATE EXTENSION should succeed
      const [createExtensionResult, uuidTestResult] = results

      expectSuccessfulQuery(createExtensionResult, 'CREATE EXTENSION')
      expect(createExtensionResult?.sql).toContain('uuid-ossp')

      // Second statement: Using uuid function should work
      expectSuccessfulQuery(uuidTestResult)
      expect(uuidTestResult?.sql.trim()).toBe(
        'SELECT uuid_generate_v4() IS NOT NULL as uuid_works',
      )
      expectUuidFunctionWorks(uuidTestResult)
    })

    it('should handle multiple CREATE EXTENSION statements', async () => {
      const sql = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS hstore;
        SELECT uuid_generate_v4() IS NOT NULL as uuid_works;
      `

      const results = await manager.executeQuery(sql, {
        extensions: ['uuid-ossp', 'hstore'],
      })

      expect(results).toHaveLength(3)

      const [uuidExtensionResult, hstoreExtensionResult, uuidTestResult] =
        results

      expectSuccessfulQuery(uuidExtensionResult, 'uuid-ossp')
      expectSuccessfulQuery(hstoreExtensionResult, 'hstore')
      expectSuccessfulQuery(uuidTestResult)
      expectUuidFunctionWorks(uuidTestResult)
    })

    it('should work without extensions parameter when no extensions needed', async () => {
      const sql = 'SELECT 1 as simple_query;'
      const results = await manager.executeQuery(sql)

      expect(results).toHaveLength(1)

      const [simpleQueryResult] = results
      expectSuccessfulQuery(simpleQueryResult)
      expectSimpleQueryResult(simpleQueryResult, 1)
    })

    it('should gracefully handle unsupported extensions', async () => {
      // Request both supported and unsupported extensions
      const sql = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        SELECT uuid_generate_v4() IS NOT NULL as uuid_works;
      `

      const results = await manager.executeQuery(sql, {
        extensions: ['uuid-ossp', 'unsupported-extension'],
      })

      // Should still work for supported extensions
      expect(results).toHaveLength(2)

      const [createExtensionResult, uuidTestResult] = results

      expectSuccessfulQuery(createExtensionResult)
      expectSuccessfulQuery(uuidTestResult)
      expectUuidFunctionWorks(uuidTestResult)
    })

    it('should support UUID functions in DDL with DEFAULT values', async () => {
      // Test realistic DDL usage with UUID extension
      const sql = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE TABLE test_users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO test_users (name) VALUES ('Alice'), ('Bob');
        SELECT id, name FROM test_users WHERE name = 'Alice';
      `

      const results = await manager.executeQuery(sql, {
        extensions: ['uuid-ossp'],
      })

      expect(results).toHaveLength(4)

      const [
        createExtensionResult,
        createTableResult,
        insertResult,
        selectResult,
      ] = results

      // Extension creation should succeed
      expectSuccessfulQuery(createExtensionResult, 'CREATE EXTENSION')

      // Table creation with UUID DEFAULT should succeed
      expectSuccessfulQuery(createTableResult, 'CREATE TABLE')
      expect(createTableResult?.sql).toContain('uuid_generate_v4()')

      // Insert should succeed (UUID generated automatically)
      expectSuccessfulQuery(insertResult)
      expect(insertResult?.sql).toContain("VALUES ('Alice'), ('Bob')")

      // Select should return Alice with a valid UUID
      expectSuccessfulQuery(selectResult)
      if (
        hasRows(selectResult?.result) &&
        hasUserFields(selectResult.result.rows[0])
      ) {
        const row = selectResult.result.rows[0]
        expect(row.name).toBe('Alice')
        // UUID should be a valid UUID format (8-4-4-4-12 characters)
        expect(row.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      } else {
        expect.fail('Expected result to have rows with user data')
      }
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
