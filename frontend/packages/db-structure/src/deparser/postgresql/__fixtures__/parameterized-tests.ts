import { describe, expect, it } from 'vitest'
import type { Schema } from '../../../schema/types.js'
import { postgresqlSchemaDeparser } from '../schemaDeparser.js'
import { expectGeneratedSQLToBeParseable } from '../testUtils.js'
import { SQL_SNAPSHOTS } from './sql-snapshots.js'

interface ParameterizedTestCase {
  name: string
  buildSchema: () => Schema
  expectedSnapshot: keyof typeof SQL_SNAPSHOTS
}

export const runParameterizedTests = (
  suiteName: string,
  testCases: ParameterizedTestCase[],
) => {
  describe(suiteName, () => {
    testCases.forEach(({ name, buildSchema, expectedSnapshot }) => {
      it(`should generate ${name}`, async () => {
        const schema = buildSchema()
        const result = postgresqlSchemaDeparser(schema)

        expect(result.errors).toHaveLength(0)
        expect(result.value).toBe(SQL_SNAPSHOTS[expectedSnapshot])

        await expectGeneratedSQLToBeParseable(result.value)
      })
    })
  })
}