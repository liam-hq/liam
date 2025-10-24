import { describe, expect, it } from 'vitest'
import {
  parseTapOutput,
  type TapDirective,
  type TapSummary,
  type TapTestResult,
} from './tapParser'

describe('tapParser', () => {
  describe('parseTapOutput', () => {
    it('should parse basic successful TAP output', () => {
      const tapOutput = `1..3
ok 1 - Valid reservation should succeed
ok 2 - Invalid product_id should fail
ok 3 - Should find user`

      const result: TapSummary = parseTapOutput(tapOutput)

      expect(result.plan).toEqual({ start: 1, end: 3 })
      expect(result.total).toBe(3)
      expect(result.passed).toBe(3)
      expect(result.failed).toBe(0)
      expect(result.tests).toHaveLength(3)
      expect(result.tests[0]).toMatchObject({
        ok: true,
        testNumber: 1,
        description: 'Valid reservation should succeed',
      })
    })

    it('should parse TAP output with failures', () => {
      const tapOutput = `1..3
ok 1 - Table exists
not ok 2 - Column has correct type
# Expected: integer
# Got: text
ok 3 - Index exists`

      const result = parseTapOutput(tapOutput)

      expect(result.total).toBe(3)
      expect(result.passed).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.tests[1]).toMatchObject({
        ok: false,
        testNumber: 2,
        description: 'Column has correct type',
      })
      expect(result.tests[1]?.diagnostics?.['comments']).toEqual([
        'Expected: integer',
        'Got: text',
      ])
    })

    it('should parse TAP output with YAML diagnostics', () => {
      const tapOutput = `1..2
ok 1 - Insert succeeds
not ok 2 - Foreign key constraint works
---
severity: fail
message: Expected error but none occurred
wanted: ERROR:  insert or update on table "orders" violates foreign key constraint
got: 1 row inserted
...`

      const result = parseTapOutput(tapOutput)

      expect(result.failed).toBe(1)
      expect(result.tests[1]?.diagnostics).toMatchObject({
        severity: 'fail',
        message: 'Expected error but none occurred',
        wanted:
          'ERROR:  insert or update on table "orders" violates foreign key constraint',
        got: '1 row inserted',
      })
    })

    it('should parse real pgTAP output from schema test', () => {
      const tapOutput = `1..4
ok 1 - Table users should exist
ok 2 - Column users.id should be of type uuid
ok 3 - Column users.email should be of type text
not ok 4 - Column users.created_at should have default
# Failed test 4: "Column users.created_at should have default"
#         have: Column users.created_at
#         want: default value`

      const result = parseTapOutput(tapOutput)

      expect(result.plan).toEqual({ start: 1, end: 4 })
      expect(result.total).toBe(4)
      expect(result.passed).toBe(3)
      expect(result.failed).toBe(1)
      expect(result.tests[3]).toMatchObject({
        ok: false,
        testNumber: 4,
        description: 'Column users.created_at should have default',
      })
      expect(result.tests[3]?.diagnostics?.['comments']).toContain(
        'Failed test 4: "Column users.created_at should have default"',
      )
    })

    it('should parse TAP output with TODO directive', () => {
      const tapOutput = `1..3
ok 1 - Basic test
not ok 2 - Complex test # TODO Not implemented yet
ok 3 - Another test`

      const result = parseTapOutput(tapOutput)

      expect(result.total).toBe(3)
      expect(result.passed).toBe(2)
      expect(result.todo).toBe(1)
      const testWithDirective: TapTestResult | undefined = result.tests[1]
      const expectedDirective: TapDirective = 'TODO'
      expect(testWithDirective).toMatchObject({
        ok: false,
        testNumber: 2,
        description: 'Complex test',
        directive: expectedDirective,
        directiveReason: 'Not implemented yet',
      })
    })

    it('should parse TAP output with SKIP directive', () => {
      const tapOutput = `1..3
ok 1 - Test 1
ok 2 - Test 2 # SKIP Database not available
ok 3 - Test 3`

      const result = parseTapOutput(tapOutput)

      expect(result.total).toBe(3)
      expect(result.passed).toBe(2)
      expect(result.skipped).toBe(1)
      expect(result.tests[1]).toMatchObject({
        ok: true,
        testNumber: 2,
        description: 'Test 2',
        directive: 'SKIP',
        directiveReason: 'Database not available',
      })
    })

    it('should handle empty TAP output', () => {
      const tapOutput = ''

      const result = parseTapOutput(tapOutput)

      expect(result.plan).toBeNull()
      expect(result.total).toBe(0)
      expect(result.passed).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.tests).toHaveLength(0)
    })

    it('should parse TAP output without plan', () => {
      const tapOutput = `ok 1 - Test without plan
ok 2 - Another test`

      const result = parseTapOutput(tapOutput)

      expect(result.plan).toBeNull()
      expect(result.total).toBe(2)
      expect(result.passed).toBe(2)
    })

    it('should parse complex real-world pgTAP output', () => {
      const tapOutput = `1..8
ok 1 - Schema public should exist
ok 2 - Table users should exist
ok 3 - Table users should have column id
ok 4 - Column users.id should be type uuid
not ok 5 - Column users.id should be primary key
# Failed test 5: "Column users.id should be primary key"
#     Column users.id is not a primary key
ok 6 - Table users should have column email
not ok 7 - Column users.email should have constraint unique
---
message: Constraint not found
severity: fail
...
ok 8 - Table users should have column created_at`

      const result = parseTapOutput(tapOutput)

      expect(result.plan).toEqual({ start: 1, end: 8 })
      expect(result.total).toBe(8)
      expect(result.passed).toBe(6)
      expect(result.failed).toBe(2)

      expect(result.tests[4]).toMatchObject({
        ok: false,
        testNumber: 5,
        description: 'Column users.id should be primary key',
      })
      expect(result.tests[4]?.diagnostics?.['comments']).toContain(
        'Failed test 5: "Column users.id should be primary key"',
      )

      expect(result.tests[6]).toMatchObject({
        ok: false,
        testNumber: 7,
        description: 'Column users.email should have constraint unique',
      })
      expect(result.tests[6]?.diagnostics).toMatchObject({
        message: 'Constraint not found',
        severity: 'fail',
      })
    })

    it('should handle TAP output with mixed line endings', () => {
      const tapOutput = '1..2\nok 1 - Test 1\r\nok 2 - Test 2'

      const result = parseTapOutput(tapOutput)

      expect(result.total).toBe(2)
      expect(result.passed).toBe(2)
    })

    it('should parse TAP output with test description containing special characters', () => {
      const tapOutput = `1..2
ok 1 - Test with "quotes" and 'apostrophes'
ok 2 - Test with $special @characters #and numbers 123`

      const result = parseTapOutput(tapOutput)

      expect(result.tests[0]?.description).toBe(
        'Test with "quotes" and \'apostrophes\'',
      )
      expect(result.tests[1]?.description).toBe(
        'Test with $special @characters #and numbers 123',
      )
    })

    it('should parse TAP output without test descriptions', () => {
      const tapOutput = `1..3
ok 1
not ok 2
ok 3`

      const result = parseTapOutput(tapOutput)

      expect(result.total).toBe(3)
      expect(result.passed).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.tests[0]?.description).toBe('')
      expect(result.tests[1]?.description).toBe('')
    })

    it('should handle YAML diagnostics with multiline values', () => {
      const tapOutput = `1..1
not ok 1 - Complex failure
---
message: Key constraint violation
detail: Key (email)=(test@example.com) already exists
hint: Use UPDATE instead
...`

      const result = parseTapOutput(tapOutput)

      expect(result.tests[0]?.diagnostics).toBeDefined()
      const diagnostics = result.tests[0]?.diagnostics
      expect(diagnostics?.['message']).toBe('Key constraint violation')
      expect(diagnostics?.['detail']).toBe(
        'Key (email)=(test@example.com) already exists',
      )
      expect(diagnostics?.['hint']).toBe('Use UPDATE instead')
    })
  })
})
