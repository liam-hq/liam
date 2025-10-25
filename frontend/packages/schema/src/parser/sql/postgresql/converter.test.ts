import { describe, expect, it } from 'vitest'
import { UnexpectedTokenWarningError } from '../../errors.js'
import { convertToSchema } from './converter.js'
import { parse } from './parser.js'

describe('convertToSchema', () => {
  describe('CHECK constraint error handling', () => {
    it('should report error when CHECK constraint parentheses cannot be found', async () => {
      // Test error handling when chunk offset causes wrong absoluteLocation
      const sql = /* sql */ `
        CREATE TABLE test_table (
          id INTEGER,
          status TEXT,
          CONSTRAINT test_check CHECK (status = 'active')
        );
      `

      const parseResult = await parse(sql)
      if (parseResult.parse_tree?.stmts.length > 0) {
        const schema = { tables: {}, enums: {}, extensions: {} }

        // Wrong offset simulates pre-fix bug condition
        const wrongChunkOffset = 1000
        const { errors } = convertToSchema(
          parseResult.parse_tree.stmts,
          sql,
          schema,
          wrongChunkOffset,
          sql,
        )

        expect(errors).toEqual([
          new UnexpectedTokenWarningError(
            'Failed to find balanced parentheses for CHECK constraint "test_check"',
          ),
        ])
      }
    })
  })
})
