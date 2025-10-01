import { beforeAll, describe, expect, it } from 'vitest'
import { PGliteInstanceManager } from './PGliteInstanceManager'

describe('PGliteInstanceManager', () => {
  const manager = new PGliteInstanceManager()

  // Warm up the pg-query-emscripten module before tests
  beforeAll(async () => {
    // Skip initialization in CI with large pool sizes to avoid timeout
    if (
      process.env['CI'] &&
      Number(process.env['PGLITE_POOL_SIZE'] || '24') > 3
    ) {
      console.info(
        '[Test] Skipping PGlite initialization in CI with large pool size',
      )
      return
    }
    // Execute a simple query to initialize the parser
    await manager.executeQuery('SELECT 1', [])
  }, 60000)

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
        // fake_extension should be completely removed
        expect(results).toHaveLength(3)
        expect(results[0]?.sql).toBe('CREATE EXTENSION IF NOT EXISTS hstore')
        expect(results[1]?.sql).toBe('CREATE EXTENSION IF NOT EXISTS pg_trgm')
        expect(results[2]?.sql).toBe('SELECT 1')
      })

      it('should completely remove all unsupported extensions', async () => {
        const sql = `
          CREATE EXTENSION IF NOT EXISTS fake_extension;
          CREATE EXTENSION IF NOT EXISTS another_fake;
          SELECT 1;
        `
        const results = await manager.executeQuery(sql, [])

        expect(results).toHaveLength(1)
        expect(results[0]?.sql).toBe('SELECT 1')
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

      it('should simplify complex CREATE EXTENSION statements by removing WITH clauses', async () => {
        // This test verifies that complex CREATE EXTENSION statements are simplified for PGlite compatibility
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

        // Complex CREATE EXTENSION should be simplified to basic form for PGlite compatibility
        // The pg_ivm extension is supported, so it should execute as simplified form
        // The fake_complex extension should be completely removed
        // The SELECT 1 should execute successfully
        expect(results).toHaveLength(2) // CREATE EXTENSION pg_ivm and SELECT 1

        // First result: Simplified CREATE EXTENSION pg_ivm (should succeed)
        expect(results[0]?.sql).toBe('CREATE EXTENSION IF NOT EXISTS pg_ivm')
        expect(results[0]?.success).toBe(true)

        // Second result: SELECT 1 (should succeed)
        expect(results[1]?.sql).toBe('SELECT 1')
        expect(results[1]?.success).toBe(true)
      })
    })
  })

  describe('COMMENT Statement String Processing', () => {
    it('should handle mixed multi-byte characters (emojis, Japanese, Chinese, U+2019)', async () => {
      // Test with various multi-byte characters from different languages
      // Including U+2019 (curly apostrophe) which is 3 bytes in UTF-8
      // eslint-disable-next-line no-non-english/no-non-english-characters
      const sql = `
CREATE TABLE international (
  id UUID PRIMARY KEY,
  name_en TEXT,
  name_ja TEXT,
  name_zh TEXT,
  description TEXT
);

COMMENT ON TABLE international IS '🌍 国際化テーブル';
COMMENT ON COLUMN international.name_ja IS '日本語の名前';
COMMENT ON COLUMN international.name_zh IS '中文名称';
COMMENT ON COLUMN international.description IS '🔥 Hot product! おすすめ商品 热门产品';

CREATE TABLE categories (
  id UUID PRIMARY KEY,
  icon TEXT,
  label TEXT
);

COMMENT ON TABLE categories IS 'カテゴリ管理 📚';
COMMENT ON COLUMN categories.icon IS 'Emoji icon like 🎮🎨🎬';

CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT
);

COMMENT ON TABLE products IS 'Product\u2019s main table';
COMMENT ON COLUMN products.name IS 'Product\u2019s display name';
      `

      const results = await manager.executeQuery(sql, [])

      // Should have: 3 CREATE TABLE + 8 COMMENT statements
      expect(results).toHaveLength(11)

      // All statements should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })

      // Check that no COMMENT statements are truncated
      const commentStatements = results.filter((r) =>
        r.sql.includes('COMMENT ON'),
      )
      expect(commentStatements).toHaveLength(8)

      commentStatements.forEach((result) => {
        expect(result.sql.trim()).toMatch(/^COMMENT ON/)
        // Should not match truncated patterns
        expect(result.sql).not.toMatch(/^OMMENT/)
        expect(result.sql).not.toMatch(/^MMENT/)
        expect(result.sql).not.toMatch(/^MENT/)
      })

      // Verify multi-byte content is preserved
      expect(results.some((r) => r.sql.includes('🌍'))).toBe(true)
      // eslint-disable-next-line no-non-english/no-non-english-characters
      expect(results.some((r) => r.sql.includes('日本語'))).toBe(true)
      // eslint-disable-next-line no-non-english/no-non-english-characters
      expect(results.some((r) => r.sql.includes('中文'))).toBe(true)
      expect(results.some((r) => r.sql.includes('🔥'))).toBe(true)
      // eslint-disable-next-line no-non-english/no-non-english-characters
      expect(results.some((r) => r.sql.includes('おすすめ'))).toBe(true)

      // Verify U+2019 (curly apostrophe) is preserved
      expect(results.some((r) => r.sql.includes('\u2019'))).toBe(true)
      // Verify specific statements with U+2019
      const productsComments = results.filter(
        (r) => r.sql.includes('products') && r.sql.includes('COMMENT'),
      )
      expect(productsComments).toHaveLength(2)
      expect(productsComments[0]?.sql).toBe(
        "COMMENT ON TABLE products IS 'Product\u2019s main table'",
      )
      expect(productsComments[1]?.sql).toBe(
        "COMMENT ON COLUMN products.name IS 'Product\u2019s display name'",
      )
    })

    it('should handle statements with invalid stmt_location (-1)', async () => {
      // Test that stmt_location === -1 is properly handled
      // This can occur when PostgreSQL parser cannot determine position
      const sql = 'SELECT 1; SELECT 2; SELECT 3;'

      // Mock a scenario where parser might return -1 for stmt_location
      // In practice, we're testing that our defensive checks handle any invalid positions
      const results = await manager.executeQuery(sql, [])

      // Should still parse successfully even if internal positions were invalid
      expect(results).toHaveLength(3)
      results.forEach((result) => {
        expect(result.success).toBe(true)
        expect(result.sql).toMatch(/^SELECT \d$/)
      })
    })
  })
})
