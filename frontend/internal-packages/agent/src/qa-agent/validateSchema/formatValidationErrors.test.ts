import { describe, expect, it } from 'vitest'
import type { AnalyzedRequirements } from '../../schemas/analyzedRequirements'
import { formatValidationErrors } from './formatValidationErrors'

describe('formatValidationErrors', () => {
  it('should format single failed test case', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Test goal',
      testcases: {
        users: [
          {
            id: 'test-1',
            title: 'Test Insert Operation',
            type: 'INSERT',
            sql: "INSERT INTO users (id, name) VALUES (1, 'John')",
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: false,
                message: 'duplicate key value violates unique constraint',
              },
            ],
          },
        ],
      },
    }

    const formatted = formatValidationErrors(analyzedRequirements)

    expect(formatted).toMatchInlineSnapshot(`
      "## Summary
      - Schema problems: 1
      - SQL quality problems: 0
      - Unknown problems: 0
      - **Total failures: 1**

      ## 🔧 Schema Issues (DB Agent should fix these)

      ### ❌ **Test Insert Operation**
      **Error:**
      \`\`\`
      duplicate key value violates unique constraint
      \`\`\`
      **Test code:**
      \`\`\`sql
      INSERT INTO users (id, name) VALUES (1, 'John')
      \`\`\`"
    `)
  })

  it('should format single test case with complex error', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Test goal',
      testcases: {
        accounts: [
          {
            id: 'test-1',
            title: 'Complex Transaction Test',
            type: 'INSERT',
            sql: "INSERT INTO accounts (id) VALUES ('invalid-uuid')",
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: false,
                message: 'invalid input syntax for type uuid',
              },
            ],
          },
        ],
      },
    }

    const formatted = formatValidationErrors(analyzedRequirements)

    expect(formatted).toMatchInlineSnapshot(`
      "## Summary
      - Schema problems: 0
      - SQL quality problems: 0
      - Unknown problems: 1
      - **Total failures: 1**

      ## ⚠️ Unknown Issues (Need investigation)

      ### ❌ **Complex Transaction Test**
      **Error:**
      \`\`\`
      invalid input syntax for type uuid
      \`\`\`
      **Test code:**
      \`\`\`sql
      INSERT INTO accounts (id) VALUES ('invalid-uuid')
      \`\`\`"
    `)
  })

  it('should format multiple failed test cases', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Test goal',
      testcases: {
        users: [
          {
            id: 'test-1',
            title: 'First Test Case',
            type: 'INSERT',
            sql: 'INSERT INTO table1 VALUES (1)',
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: false,
                message: 'table1 does not exist',
              },
            ],
          },
          {
            id: 'test-2',
            title: 'Second Test Case',
            type: 'SELECT',
            sql: 'SELECT * FROM table2',
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: true,
                message: 'Operations completed successfully',
              },
            ],
          },
        ],
        accounts: [
          {
            id: 'test-3',
            title: 'Third Test Case',
            type: 'UPDATE',
            sql: 'UPDATE table2 SET col = 1',
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: false,
                message: 'permission denied',
              },
            ],
          },
        ],
      },
    }

    const formatted = formatValidationErrors(analyzedRequirements)

    expect(formatted).toMatchInlineSnapshot(`
      "## Summary
      - Schema problems: 1
      - SQL quality problems: 0
      - Unknown problems: 1
      - **Total failures: 2**

      ## 🔧 Schema Issues (DB Agent should fix these)

      ### ❌ **First Test Case**
      **Error:**
      \`\`\`
      table1 does not exist
      \`\`\`
      **Test code:**
      \`\`\`sql
      INSERT INTO table1 VALUES (1)
      \`\`\`
      ## ⚠️ Unknown Issues (Need investigation)

      ### ❌ **Third Test Case**
      **Error:**
      \`\`\`
      permission denied
      \`\`\`
      **Test code:**
      \`\`\`sql
      UPDATE table2 SET col = 1
      \`\`\`"
    `)
  })

  it('should return success message when no failures', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Test goal',
      testcases: {
        users: [
          {
            id: 'test-1',
            title: 'Successful Test',
            type: 'INSERT',
            sql: 'INSERT INTO users VALUES (1)',
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: true,
                message: 'Operations completed successfully',
              },
            ],
          },
        ],
      },
    }

    const formatted = formatValidationErrors(analyzedRequirements)

    expect(formatted).toBe(
      'Database validation complete: all checks passed successfully',
    )
  })

  it('should return success message when no test cases', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Test goal',
      testcases: {},
    }

    const formatted = formatValidationErrors(analyzedRequirements)

    expect(formatted).toBe(
      'Database validation complete: all checks passed successfully',
    )
  })

  it('should display full long SQL statements', () => {
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

    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Test goal',
      testcases: {
        users: [
          {
            id: 'test-1',
            title: 'Long SQL Test',
            type: 'INSERT',
            sql: longSql,
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: false,
                message: 'syntax error',
              },
            ],
          },
        ],
      },
    }

    const formatted = formatValidationErrors(analyzedRequirements)

    expect(formatted).toMatchInlineSnapshot(`
      "## Summary
      - Schema problems: 0
      - SQL quality problems: 1
      - Unknown problems: 0
      - **Total failures: 1**

      ## 📝 SQL Quality Issues (QA Agent should fix these)

      ### ❌ **Long SQL Test**
      **Error:**
      \`\`\`
      syntax error
      \`\`\`
      **Test code:**
      \`\`\`sql
      INSERT INTO very_long_table_name_with_many_columns (
            column1, column2, column3, column4, column5, column6, column7, column8,
            column9, column10, column11, column12, column13, column14, column15,
            column16, column17, column18, column19, column20, column21, column22,
            column23, column24, column25, column26, column27, column28, column29,
            column30, column31, column32, column33, column34, column35
          ) VALUES (
            'value1', 'value2', 'value3', 'value4', 'value5', 'value6', 'value7',
            'value8', 'value9', 'value10', 'value11', 'value12', 'value13'
          )
      \`\`\`"
    `)
  })

  it('should preserve comment lines in SQL', () => {
    const sqlWithComments = `-- This is a comment
    INSERT INTO users (id, name) VALUES (1, 'John');
    -- Another comment
    UPDATE users SET active = true WHERE id = 1;`

    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Test goal',
      testcases: {
        users: [
          {
            id: 'test-1',
            title: 'SQL with Comments',
            type: 'INSERT',
            sql: sqlWithComments,
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: false,
                message: 'some error',
              },
            ],
          },
        ],
      },
    }

    const formatted = formatValidationErrors(analyzedRequirements)

    expect(formatted).toMatchInlineSnapshot(`
      "## Summary
      - Schema problems: 0
      - SQL quality problems: 0
      - Unknown problems: 1
      - **Total failures: 1**

      ## ⚠️ Unknown Issues (Need investigation)

      ### ❌ **SQL with Comments**
      **Error:**
      \`\`\`
      some error
      \`\`\`
      **Test code:**
      \`\`\`sql
      -- This is a comment
          INSERT INTO users (id, name) VALUES (1, 'John');
          -- Another comment
          UPDATE users SET active = true WHERE id = 1;
      \`\`\`"
    `)
  })

  it('should handle failed case without SQL details', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Test goal',
      testcases: {
        users: [
          {
            id: 'test-1',
            title: 'Test with minimal error info',
            type: 'INSERT',
            sql: '',
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: false,
                message: 'Unknown error occurred',
              },
            ],
          },
        ],
      },
    }

    const formatted = formatValidationErrors(analyzedRequirements)

    expect(formatted).toMatchInlineSnapshot(`
      "## Summary
      - Schema problems: 0
      - SQL quality problems: 0
      - Unknown problems: 1
      - **Total failures: 1**

      ## ⚠️ Unknown Issues (Need investigation)

      ### ❌ **Test with minimal error info**
      **Error:**
      \`\`\`
      Unknown error occurred
      \`\`\`
      **Test code:**
      \`\`\`sql

      \`\`\`"
    `)
  })

  it('should handle special characters in error messages', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Test goal',
      testcases: {
        users: [
          {
            id: 'test-1',
            title: 'Test with Special Characters',
            type: 'INSERT',
            sql: "INSERT INTO test VALUES ('data')",
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: false,
                message:
                  'Error with `backticks` and "quotes" and \'single quotes\'',
              },
            ],
          },
        ],
      },
    }

    const formatted = formatValidationErrors(analyzedRequirements)

    expect(formatted).toMatchInlineSnapshot(`
      "## Summary
      - Schema problems: 0
      - SQL quality problems: 0
      - Unknown problems: 1
      - **Total failures: 1**

      ## ⚠️ Unknown Issues (Need investigation)

      ### ❌ **Test with Special Characters**
      **Error:**
      \`\`\`
      Error with \`backticks\` and "quotes" and 'single quotes'
      \`\`\`
      **Test code:**
      \`\`\`sql
      INSERT INTO test VALUES ('data')
      \`\`\`"
    `)
  })

  it('should use latest test result when multiple results exist', () => {
    const analyzedRequirements: AnalyzedRequirements = {
      goal: 'Test goal',
      testcases: {
        users: [
          {
            id: 'test-1',
            title: 'Test with Multiple Results',
            type: 'INSERT',
            sql: 'INSERT INTO users VALUES (1)',
            testResults: [
              {
                executedAt: '2024-01-01T00:00:00Z',
                success: false,
                message: 'First execution failed',
              },
              {
                executedAt: '2024-01-01T01:00:00Z',
                success: true,
                message: 'Second execution succeeded',
              },
            ],
          },
        ],
      },
    }

    const formatted = formatValidationErrors(analyzedRequirements)

    expect(formatted).toBe(
      'Database validation complete: all checks passed successfully',
    )
  })
})
