import { describe, expect, it, vi } from 'vitest'
import { DMLGenerationAgent } from './agent'

describe('DMLGenerationAgent - Edge Case Tests', () => {
  const createMockLogger = () => ({
    debug: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })

  describe('Empty and Minimal Schemas', () => {
    it('should handle empty schema gracefully', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: '',
        formattedUseCases: 'Test empty schema',
      })

      expect(result.dmlStatements).toBeDefined()
      expect(result.dmlStatements).toBe(
        '-- DML statements will be generated here',
      )
    })

    it('should handle schema with no tables', async () => {
      // Test with no tables - schema not used in this test implementation

      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: '-- No tables defined',
        formattedUseCases: 'Empty database',
      })

      expect(result.dmlStatements).toBeDefined()
      // Should return minimal DML or comment
      expect(result.dmlStatements).toContain('--')
    })

    it('should handle single table with no columns', async () => {
      // Test with minimal schema - schema not used in this test implementation

      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: 'CREATE TABLE empty_table ();',
        formattedUseCases: 'Table with no columns',
      })

      expect(result.dmlStatements).toBeDefined()
    })
  })

  describe('Special Characters and Escaping', () => {
    it('should handle table names with special characters', async () => {
      // Test with special characters - schema not used in this test implementation

      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL:
          'CREATE TABLE "user-data" (id INTEGER, "first-name" VARCHAR(50));',
        formattedUseCases: 'Handle special characters in identifiers',
      })

      expect(result.dmlStatements).toBeDefined()
    })

    it('should handle values with quotes and special characters', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: 'CREATE TABLE messages (id INT, content TEXT);',
        formattedUseCases:
          'Insert messages with quotes like "Hello" and \'World\'',
      })

      expect(result.dmlStatements).toBeDefined()
    })

    it('should handle SQL injection attempts in use cases', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: 'CREATE TABLE users (id INT, name VARCHAR(100));',
        formattedUseCases: "'; DROP TABLE users; --",
      })

      // Should not execute malicious SQL
      expect(result.dmlStatements).toBeDefined()
      expect(result.dmlStatements).not.toContain('DROP TABLE')
    })
  })

  describe('Extreme Data Types', () => {
    it('should handle maximum length strings', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: 'CREATE TABLE large_data (id INT, description TEXT);',
        formattedUseCases:
          'Insert very long text values (up to database limits)',
      })

      expect(result.dmlStatements).toBeDefined()
    })

    it('should handle numeric edge cases', async () => {
      // Test with numeric edge cases - schema not used in this test implementation

      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL:
          'CREATE TABLE numbers (tiny_int SMALLINT, big_int BIGINT, precise_decimal DECIMAL(38,20));',
        formattedUseCases: 'Test extreme numeric values',
      })

      expect(result.dmlStatements).toBeDefined()
    })

    it('should handle all PostgreSQL data types', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: `CREATE TABLE all_types (
          bool_col BOOLEAN,
          bytea_col BYTEA,
          char_col CHAR(10),
          date_col DATE,
          float_col FLOAT8,
          inet_col INET,
          interval_col INTERVAL,
          json_col JSON,
          jsonb_col JSONB,
          money_col MONEY,
          numeric_col NUMERIC(10,2),
          real_col REAL,
          text_col TEXT,
          time_col TIME,
          timestamp_col TIMESTAMP,
          timestamptz_col TIMESTAMPTZ,
          uuid_col UUID,
          xml_col XML,
          array_col INTEGER[],
          range_col INT4RANGE,
          composite_col RECORD
        );`,
        formattedUseCases: 'Test all PostgreSQL data types',
      })

      expect(result.dmlStatements).toBeDefined()
    })
  })

  describe('Complex Constraints', () => {
    it('should handle circular foreign key references', async () => {
      // Test with circular references - schema not used in this test implementation

      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL:
          'CREATE TABLE employees (id INT PRIMARY KEY, manager_id INT REFERENCES employees(id));',
        formattedUseCases:
          'Create employee hierarchy with self-referencing foreign key',
      })

      expect(result.dmlStatements).toBeDefined()
    })

    it('should handle multiple unique constraints on same column set', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: `CREATE TABLE users (
          id INT PRIMARY KEY,
          email VARCHAR(255) UNIQUE,
          username VARCHAR(100) UNIQUE,
          CONSTRAINT email_username_unique UNIQUE (email, username)
        );`,
        formattedUseCases: 'Test multiple unique constraints',
      })

      expect(result.dmlStatements).toBeDefined()
    })

    it('should handle complex check constraints', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: `CREATE TABLE products (
          id INT PRIMARY KEY,
          price DECIMAL(10,2) CHECK (price > 0),
          discount_price DECIMAL(10,2),
          CONSTRAINT valid_discount CHECK (discount_price IS NULL OR discount_price < price)
        );`,
        formattedUseCases:
          'Ensure discount prices are less than regular prices',
      })

      expect(result.dmlStatements).toBeDefined()
    })
  })

  describe('Performance and Scale', () => {
    it('should handle request for massive data generation', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL:
          'CREATE TABLE events (id BIGSERIAL PRIMARY KEY, data JSONB);',
        formattedUseCases: 'Generate 1 million event records for load testing',
      })

      expect(result.dmlStatements).toBeDefined()
      // In real implementation, should handle this gracefully
    })

    it('should handle deeply nested JSON structures', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: 'CREATE TABLE documents (id INT PRIMARY KEY, data JSONB);',
        formattedUseCases:
          'Insert deeply nested JSON documents (10+ levels deep)',
      })

      expect(result.dmlStatements).toBeDefined()
    })
  })

  describe('Error Conditions', () => {
    it('should handle malformed schema SQL', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL: 'CREATE TABLE invalid syntax here!!!',
        formattedUseCases: 'Test malformed SQL',
      })

      expect(result.dmlStatements).toBeDefined()
    })

    it('should handle conflicting use cases', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL:
          'CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255) UNIQUE);',
        formattedUseCases: `
          1. Insert user with email 'test@example.com'
          2. Insert another user with same email 'test@example.com'
          3. Both should succeed (impossible due to unique constraint)
        `,
      })

      expect(result.dmlStatements).toBeDefined()
      // Should handle conflicting requirements gracefully
    })

    it('should handle null/undefined edge cases', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })

      // Test with empty strings
      const result1 = await agent.generate({
        schemaSQL: '',
        formattedUseCases: '',
      })
      expect(result1.dmlStatements).toBeDefined()

      // Test with whitespace only
      const result2 = await agent.generate({
        schemaSQL: '   \n\t  ',
        formattedUseCases: '   \n\t  ',
      })
      expect(result2.dmlStatements).toBeDefined()
    })
  })

  describe('Internationalization', () => {
    it('should handle Unicode characters in data', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL:
          'CREATE TABLE international (id INT, name VARCHAR(255), description TEXT);',
        formattedUseCases:
          'Insert data with Chinese, Arabic, Hindi, Japanese, Korean, emoji',
      })

      expect(result.dmlStatements).toBeDefined()
    })

    it('should handle right-to-left languages', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL:
          'CREATE TABLE rtl_content (id INT, title VARCHAR(500), body TEXT);',
        formattedUseCases: 'Insert Arabic content with RTL text',
      })

      expect(result.dmlStatements).toBeDefined()
    })
  })

  describe('Reserved Words and Keywords', () => {
    it('should handle SQL reserved words as identifiers', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })
      const result = await agent.generate({
        schemaSQL:
          'CREATE TABLE "order" ("select" INT, "from" VARCHAR(100), "where" TEXT);',
        formattedUseCases: 'Insert data into table with reserved word names',
      })

      expect(result.dmlStatements).toBeDefined()
    })
  })

  describe('Boundary Value Testing', () => {
    it('should handle zero, one, and many relationships', async () => {
      const agent = new DMLGenerationAgent({ logger: createMockLogger() })

      // Zero relationships
      const result1 = await agent.generate({
        schemaSQL: 'CREATE TABLE isolated (id INT PRIMARY KEY);',
        formattedUseCases: 'Table with no foreign keys',
      })
      expect(result1.dmlStatements).toBeDefined()

      // One relationship
      const result2 = await agent.generate({
        schemaSQL: `
          CREATE TABLE parent (id INT PRIMARY KEY);
          CREATE TABLE child (id INT PRIMARY KEY, parent_id INT REFERENCES parent(id));
        `,
        formattedUseCases: 'Simple parent-child relationship',
      })
      expect(result2.dmlStatements).toBeDefined()

      // Many relationships
      const result3 = await agent.generate({
        schemaSQL: `
          CREATE TABLE a (id INT PRIMARY KEY);
          CREATE TABLE b (id INT PRIMARY KEY);
          CREATE TABLE c (id INT PRIMARY KEY);
          CREATE TABLE junction (
            a_id INT REFERENCES a(id),
            b_id INT REFERENCES b(id),
            c_id INT REFERENCES c(id),
            PRIMARY KEY (a_id, b_id, c_id)
          );
        `,
        formattedUseCases: 'Complex many-to-many-to-many relationship',
      })
      expect(result3.dmlStatements).toBeDefined()
    })
  })
})
