import { describe, expect, it } from 'vitest'
import { formatToolCallArgs } from './formatToolCallArgs'

describe('formatToolCallArgs - Observable Behavior', () => {
  describe('Basic argument handling', () => {
    it('returns empty string for empty args', () => {
      expect(formatToolCallArgs({})).toBe('')
    })

    it('formats single argument', () => {
      expect(
        formatToolCallArgs({ command: 'pnpm lint' }),
      ).toMatchInlineSnapshot(`"command: "pnpm lint""`)
    })

    it('truncates long strings', () => {
      expect(
        formatToolCallArgs({
          long_string:
            'this is a very long string that exceeds the maximum length',
        }),
      ).toMatchInlineSnapshot(`"long_string: "this is a very lo...""`)
    })

    it('shows first 2 arguments when more than 2 provided', () => {
      expect(
        formatToolCallArgs({
          first: 'value1',
          second: 'value2',
          third: 'value3',
          fourth: 'value4',
        }),
      ).toMatchInlineSnapshot(`"first: "value1", second: "value2", +2 more"`)
    })
  })

  describe('Value type handling', () => {
    it('handles string values', () => {
      expect(
        formatToolCallArgs({
          text: 'hello',
        }),
      ).toMatchInlineSnapshot(`"text: "hello""`)
    })

    it('handles number values', () => {
      expect(
        formatToolCallArgs({
          count: 42,
        }),
      ).toMatchInlineSnapshot(`"count: 42"`)
    })

    it('handles true boolean values', () => {
      expect(
        formatToolCallArgs({
          enabled: true,
        }),
      ).toMatchInlineSnapshot(`"enabled: true"`)
    })

    it('handles false boolean values', () => {
      expect(
        formatToolCallArgs({
          disabled: false,
        }),
      ).toMatchInlineSnapshot(`"disabled: false"`)
    })

    it('handles null values', () => {
      expect(
        formatToolCallArgs({
          nullable: null,
        }),
      ).toMatchInlineSnapshot(`"nullable: null"`)
    })

    it('handles undefined values', () => {
      expect(
        formatToolCallArgs({
          missing: undefined,
        }),
      ).toMatchInlineSnapshot(`"missing: undefined"`)
    })

    it('handles small arrays', () => {
      expect(
        formatToolCallArgs({
          items: [1, 2, 3],
        }),
      ).toMatchInlineSnapshot(`"items: [1, 2, 3]"`)
    })

    it('handles large arrays', () => {
      expect(
        formatToolCallArgs({
          items: new Array(10).fill('item'),
        }),
      ).toMatchInlineSnapshot(`"items: [10 items]"`)
    })

    it('handles small objects', () => {
      expect(
        formatToolCallArgs({
          config: { key: 'value' },
        }),
      ).toMatchInlineSnapshot(`"config: {key: "value"}"`)
    })

    it('handles large objects', () => {
      expect(
        formatToolCallArgs({
          config: { a: 1, b: 2, c: 3, d: 4, e: 5 },
        }),
      ).toMatchInlineSnapshot(`"config: {5 keys}"`)
    })

    it('handles deeply nested structures', () => {
      expect(
        formatToolCallArgs({
          config: {
            database: { host: 'localhost', port: 5432 },
            features: ['auth', 'logging', 'metrics'],
            enabled: true,
          },
        }),
      ).toMatchInlineSnapshot(`"config: {3 keys}"`)
    })
  })

  describe('Real-world examples', () => {
    it('formats schemaDesignTool args', () => {
      const args = {
        operations: [
          { op: 'add', path: '/extensions/pgcrypto' },
          { op: 'add', path: '/tables/users' },
          { op: 'add', path: '/tables/roles' },
        ],
      }
      expect(formatToolCallArgs(args)).toMatchInlineSnapshot(
        `"operations: [3 items]"`,
      )
    })

    it('formats tool with mixed argument types', () => {
      expect(
        formatToolCallArgs({
          pattern: 'extractToolCallsFromMessage',
          recursive: true,
          max_results: 100,
        }),
      ).toMatchInlineSnapshot(
        `"pattern: "extractToolCallsF...", recursive: true, +1 more"`,
      )
    })
  })
})
