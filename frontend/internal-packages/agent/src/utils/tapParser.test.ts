import { describe, expect, it } from 'vitest'
import { parseTapOutput } from './tapParser'

describe('tapParser', () => {
  describe('parseTapOutput', () => {
    it('should parse simple passing test', () => {
      const output = `1..1
ok 1 - Valid reservation should succeed`

      const result = parseTapOutput(output)

      expect(result.plan).toEqual({ start: 1, end: 1 })
      expect(result.total).toBe(1)
      expect(result.passed).toBe(1)
      expect(result.failed).toBe(0)
      expect(result.skipped).toBe(0)
      expect(result.todo).toBe(0)
      expect(result.tests).toHaveLength(1)
      expect(result.tests[0]).toEqual({
        ok: true,
        testNumber: 1,
        description: 'Valid reservation should succeed',
      })
    })

    it('should parse simple failing test', () => {
      const output = `1..1
not ok 1 - Invalid product_id should fail`

      const result = parseTapOutput(output)

      expect(result.plan).toEqual({ start: 1, end: 1 })
      expect(result.total).toBe(1)
      expect(result.passed).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.tests[0]).toEqual({
        ok: false,
        testNumber: 1,
        description: 'Invalid product_id should fail',
      })
    })

    it('should parse multiple tests', () => {
      const output = `1..3
ok 1 - Test one
not ok 2 - Test two
ok 3 - Test three`

      const result = parseTapOutput(output)

      expect(result.plan).toEqual({ start: 1, end: 3 })
      expect(result.total).toBe(3)
      expect(result.passed).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.tests).toHaveLength(3)
    })

    it('should parse test with description containing dash', () => {
      const output = `1..1
ok 1 - User can create a reservation - with valid data`

      const result = parseTapOutput(output)

      expect(result.tests[0]?.description).toBe(
        'User can create a reservation - with valid data',
      )
    })

    it('should parse test without description', () => {
      const output = `1..1
ok 1`

      const result = parseTapOutput(output)

      expect(result.tests[0]).toEqual({
        ok: true,
        testNumber: 1,
        description: '',
      })
    })

    it('should parse test with SKIP directive', () => {
      const output = `1..2
ok 1 - Test one
ok 2 - Test two # SKIP Not implemented yet`

      const result = parseTapOutput(output)

      expect(result.total).toBe(2)
      expect(result.passed).toBe(1)
      expect(result.skipped).toBe(1)
      expect(result.tests[1]).toEqual({
        ok: true,
        testNumber: 2,
        description: 'Test two',
        directive: 'SKIP',
        directiveReason: 'Not implemented yet',
      })
    })

    it('should parse test with TODO directive', () => {
      const output = `1..2
ok 1 - Test one
not ok 2 - Test two # TODO Fix this later`

      const result = parseTapOutput(output)

      expect(result.total).toBe(2)
      expect(result.passed).toBe(1)
      expect(result.todo).toBe(1)
      expect(result.tests[1]).toEqual({
        ok: false,
        testNumber: 2,
        description: 'Test two',
        directive: 'TODO',
        directiveReason: 'Fix this later',
      })
    })

    it('should parse test with YAML diagnostic block', () => {
      const output = `1..1
not ok 1 - Invalid product_id should fail
  ---
  message: Expected error code 23503, got 23502
  severity: fail
  got: 23502
  expected: 23503
  ...`

      const result = parseTapOutput(output)

      expect(result.tests[0]?.diagnostics).toEqual({
        message: 'Expected error code 23503, got 23502',
        severity: 'fail',
        got: 23502,
        expected: 23503,
      })
    })

    it('should parse test with multiline YAML values', () => {
      const output = `1..1
not ok 1 - Query failed
  ---
  message: |
    Syntax error in SQL query
    at line 5
  query: SELECT * FROM users WHERE id = 1
  ...`

      const result = parseTapOutput(output)

      expect(result.tests[0]?.diagnostics).toMatchObject({
        message: expect.stringContaining('Syntax error'),
        query: 'SELECT * FROM users WHERE id = 1',
      })
    })

    it('should parse test with comment diagnostics', () => {
      const output = `1..1
not ok 1 - Test failed
# Additional diagnostic information
# Error occurred at line 42`

      const result = parseTapOutput(output)

      expect(result.tests[0]?.diagnostics?.['comments']).toEqual([
        'Additional diagnostic information',
        'Error occurred at line 42',
      ])
    })

    it('should handle empty lines in output', () => {
      const output = `1..2

ok 1 - Test one

not ok 2 - Test two

`

      const result = parseTapOutput(output)

      expect(result.total).toBe(2)
      expect(result.passed).toBe(1)
      expect(result.failed).toBe(1)
    })

    it('should handle output without plan', () => {
      const output = `ok 1 - Test one
ok 2 - Test two`

      const result = parseTapOutput(output)

      expect(result.plan).toBeNull()
      expect(result.total).toBe(2)
      expect(result.passed).toBe(2)
    })

    it('should handle plan at the end', () => {
      const output = `ok 1 - Test one
ok 2 - Test two
1..2`

      const result = parseTapOutput(output)

      expect(result.plan).toEqual({ start: 1, end: 2 })
      expect(result.total).toBe(2)
    })

    it('should parse mixed success and failure tests', () => {
      const output = `1..5
ok 1 - First test passes
not ok 2 - Second test fails
ok 3 - Third test passes
not ok 4 - Fourth test fails
ok 5 - Fifth test passes`

      const result = parseTapOutput(output)

      expect(result.passed).toBe(3)
      expect(result.failed).toBe(2)
    })

    it('should handle case-insensitive ok/not ok', () => {
      const output = `1..2
OK 1 - Test one
NOT OK 2 - Test two`

      const result = parseTapOutput(output)

      expect(result.tests[0]?.ok).toBe(true)
      expect(result.tests[1]?.ok).toBe(false)
    })

    it('should handle test description without dash separator', () => {
      const output = `1..1
ok 1 Test without dash`

      const result = parseTapOutput(output)

      expect(result.tests[0]?.description).toBe('Test without dash')
    })

    it('should parse YAML with numeric and boolean values', () => {
      const output = `1..1
not ok 1 - Test failed
  ---
  error_code: 23503
  timeout: 5000
  retry: true
  success: false
  ...`

      const result = parseTapOutput(output)

      expect(result.tests[0]?.diagnostics).toEqual({
        error_code: 23503,
        timeout: 5000,
        retry: true,
        success: false,
      })
    })

    it('should handle complex mixed output', () => {
      const output = `1..5
ok 1 - INSERT test passes
not ok 2 - UPDATE test fails
  ---
  message: Foreign key violation
  error_code: 23503
  ...
ok 3 - DELETE test passes # SKIP Not applicable
not ok 4 - SELECT test fails
# Query was too slow
# Consider adding an index
ok 5 - Final test passes`

      const result = parseTapOutput(output)

      expect(result.total).toBe(5)
      expect(result.passed).toBe(2)
      expect(result.failed).toBe(2)
      expect(result.skipped).toBe(1)
      expect(result.tests[1]?.diagnostics).toMatchObject({
        message: 'Foreign key violation',
        error_code: 23503,
      })
      expect(result.tests[3]?.diagnostics?.['comments']).toContain(
        'Query was too slow',
      )
    })

    it('should handle empty output', () => {
      const output = ''

      const result = parseTapOutput(output)

      expect(result.plan).toBeNull()
      expect(result.total).toBe(0)
      expect(result.passed).toBe(0)
      expect(result.failed).toBe(0)
    })

    it('should handle whitespace-only output', () => {
      const output = '   \n  \n   '

      const result = parseTapOutput(output)

      expect(result.plan).toBeNull()
      expect(result.total).toBe(0)
    })
  })
})
