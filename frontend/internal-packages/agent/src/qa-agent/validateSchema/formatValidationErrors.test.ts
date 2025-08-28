import { describe, expect, it } from 'vitest'
import { formatValidationErrors } from './formatValidationErrors'
import type { TestcaseDmlExecutionResult } from './types'

describe('formatValidationErrors', () => {
  it('should format single error with single operation', () => {
    const results: TestcaseDmlExecutionResult[] = [
      {
        testCaseId: 'test-1',
        testCaseTitle: 'Test Insert Operation',
        success: false,
        executedOperations: 1,
        failedOperations: [
          {
            sql: "INSERT INTO users (id, name) VALUES (1, 'John')",
            error: 'duplicate key value violates unique constraint',
          },
        ],
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]

    const formatted = formatValidationErrors(results)

    expect(formatted).toMatchInlineSnapshot(`
      "Database validation found 1 issues. Please fix the following errors:

      ### ❌ **Test Case:** Test Insert Operation
      #### 1. Error: \`duplicate key value violates unique constraint\`
      \`\`\`sql
      INSERT INTO users (id, name) VALUES (1, 'John')
      \`\`\`"
    `)
  })

  it('should format multiple errors in single test case', () => {
    const results: TestcaseDmlExecutionResult[] = [
      {
        testCaseId: 'test-1',
        testCaseTitle: 'Complex Transaction Test',
        success: false,
        executedOperations: 3,
        failedOperations: [
          {
            sql: "INSERT INTO accounts (id) VALUES ('invalid-uuid')",
            error: 'invalid input syntax for type uuid',
          },
          {
            sql: "UPDATE accounts SET balance = 100 WHERE id = 'invalid-uuid'",
            error:
              'current transaction is aborted, commands ignored until end of transaction block',
          },
          {
            sql: "DELETE FROM accounts WHERE id = 'invalid-uuid'",
            error:
              'current transaction is aborted, commands ignored until end of transaction block',
          },
        ],
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]

    const formatted = formatValidationErrors(results)

    expect(formatted).toMatchInlineSnapshot(`
      "Database validation found 1 issues. Please fix the following errors:

      ### ❌ **Test Case:** Complex Transaction Test
      #### 1. Error: \`invalid input syntax for type uuid\`
      \`\`\`sql
      INSERT INTO accounts (id) VALUES ('invalid-uuid')
      \`\`\`

      #### 2. Error: \`current transaction is aborted, commands ignored until end of transaction block\`
      \`\`\`sql
      UPDATE accounts SET balance = 100 WHERE id = 'invalid-uuid'
      \`\`\`

      #### 3. Error: \`current transaction is aborted, commands ignored until end of transaction block\`
      \`\`\`sql
      DELETE FROM accounts WHERE id = 'invalid-uuid'
      \`\`\`"
    `)
  })

  it('should format errors from multiple test cases', () => {
    const results: TestcaseDmlExecutionResult[] = [
      {
        testCaseId: 'test-1',
        testCaseTitle: 'First Test Case',
        success: false,
        executedOperations: 1,
        failedOperations: [
          {
            sql: 'INSERT INTO table1 VALUES (1)',
            error: 'table1 does not exist',
          },
        ],
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        testCaseId: 'test-2',
        testCaseTitle: 'Second Test Case',
        success: true,
        executedOperations: 2,
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        testCaseId: 'test-3',
        testCaseTitle: 'Third Test Case',
        success: false,
        executedOperations: 1,
        failedOperations: [
          {
            sql: 'UPDATE table2 SET col = 1',
            error: 'permission denied',
          },
        ],
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]

    const formatted = formatValidationErrors(results)

    expect(formatted).toMatchInlineSnapshot(`
      "Database validation found 2 issues. Please fix the following errors:

      ### ❌ **Test Case:** First Test Case
      #### 1. Error: \`table1 does not exist\`
      \`\`\`sql
      INSERT INTO table1 VALUES (1)
      \`\`\`

      ### ❌ **Test Case:** Third Test Case
      #### 1. Error: \`permission denied\`
      \`\`\`sql
      UPDATE table2 SET col = 1
      \`\`\`"
    `)
  })

  it('should truncate long SQL statements', () => {
    const longSql = `INSERT INTO very_long_table_name_with_many_columns (
      column1, column2, column3, column4, column5, column6, column7, column8,
      column9, column10, column11, column12, column13, column14, column15,
      column16, column17, column18, column19, column20, column21, column22,
      column23, column24, column25, column26, column27, column28, column29,
      column30, column31, column32, column33, column34, column35
    ) VALUES (
      'value1', 'value2', 'value3', 'value4', 'value5', 'value6', 'value7',
      'value8', 'value9', 'value10', 'value11', 'value12', 'value13'
    )`

    const results: TestcaseDmlExecutionResult[] = [
      {
        testCaseId: 'test-1',
        testCaseTitle: 'Long SQL Test',
        success: false,
        executedOperations: 1,
        failedOperations: [
          {
            sql: longSql,
            error: 'syntax error',
          },
        ],
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]

    const formatted = formatValidationErrors(results)

    expect(formatted).toMatchInlineSnapshot(`
      "Database validation found 1 issues. Please fix the following errors:

      ### ❌ **Test Case:** Long SQL Test
      #### 1. Error: \`syntax error\`
      \`\`\`sql
      INSERT INTO very_long_table_name_with_many_columns (
            column1, column2, column3, column4, column5, column6, column7, column8,
            column9, column10, column11, column12, column13, column14, column15,
            column16, column17, column18, column19, column20, column21, column22,
            column23, co...
      \`\`\`"
    `)
  })

  it('should preserve comment lines in SQL', () => {
    const sqlWithComments = `-- This is a comment
    INSERT INTO users (id, name) VALUES (1, 'John');
    -- Another comment
    UPDATE users SET active = true WHERE id = 1;`

    const results: TestcaseDmlExecutionResult[] = [
      {
        testCaseId: 'test-1',
        testCaseTitle: 'SQL with Comments',
        success: false,
        executedOperations: 1,
        failedOperations: [
          {
            sql: sqlWithComments,
            error: 'some error',
          },
        ],
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]

    const formatted = formatValidationErrors(results)

    expect(formatted).toMatchInlineSnapshot(`
      "Database validation found 1 issues. Please fix the following errors:

      ### ❌ **Test Case:** SQL with Comments
      #### 1. Error: \`some error\`
      \`\`\`sql
      -- This is a comment
          INSERT INTO users (id, name) VALUES (1, 'John');
          -- Another comment
          UPDATE users SET active = true WHERE id = 1;
      \`\`\`"
    `)
  })

  it('should handle empty failed operations array', () => {
    const results: TestcaseDmlExecutionResult[] = [
      {
        testCaseId: 'test-1',
        testCaseTitle: 'Test with empty failures',
        success: false,
        executedOperations: 0,
        failedOperations: [],
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]

    const formatted = formatValidationErrors(results)

    expect(formatted).toMatchInlineSnapshot(`
      "Database validation found 1 issues. Please fix the following errors:

      ### ❌ **Test Case:** Test with empty failures"
    `)
  })

  it('should return success message when all tests pass', () => {
    const results: TestcaseDmlExecutionResult[] = [
      {
        testCaseId: 'test-1',
        testCaseTitle: 'Successful Test 1',
        success: true,
        executedOperations: 5,
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        testCaseId: 'test-2',
        testCaseTitle: 'Successful Test 2',
        success: true,
        executedOperations: 3,
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]

    const formatted = formatValidationErrors(results)

    expect(formatted).toMatchInlineSnapshot(
      `"Database validation complete: all checks passed successfully"`,
    )
  })

  it('should handle special characters in error messages', () => {
    const results: TestcaseDmlExecutionResult[] = [
      {
        testCaseId: 'test-1',
        testCaseTitle: 'Test with Special Characters',
        success: false,
        executedOperations: 1,
        failedOperations: [
          {
            sql: "INSERT INTO test VALUES ('data')",
            error: 'Error with `backticks` and "quotes" and \'single quotes\'',
          },
        ],
        executedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]

    const formatted = formatValidationErrors(results)

    expect(formatted).toMatchInlineSnapshot(`
      "Database validation found 1 issues. Please fix the following errors:

      ### ❌ **Test Case:** Test with Special Characters
      #### 1. Error: \`Error with \`backticks\` and "quotes" and 'single quotes'\`
      \`\`\`sql
      INSERT INTO test VALUES ('data')
      \`\`\`"
    `)
  })
})
