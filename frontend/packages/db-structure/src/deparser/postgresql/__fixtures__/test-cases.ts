import type { Schema } from '../../../schema/types.js'

export interface TestCase {
  name: string
  schema: Schema
  expectedSnapshot: string
}

export const INDEX_TEST_CASES: TestCase[] = [
  {
    name: 'CREATE INDEX statements',
    schema: {} as Schema,
    expectedSnapshot: 'createIndexStatements',
  },
  {
    name: 'UNIQUE INDEX statements',
    schema: {} as Schema,
    expectedSnapshot: 'uniqueIndexStatements',
  },
  {
    name: 'composite INDEX statements',
    schema: {} as Schema,
    expectedSnapshot: 'compositeIndexStatements',
  },
  {
    name: 'indexes without type specified',
    schema: {} as Schema,
    expectedSnapshot: 'indexWithoutType',
  },
]

export const CONSTRAINT_TEST_CASES: TestCase[] = [
  {
    name: 'PRIMARY KEY constraints',
    schema: {} as Schema,
    expectedSnapshot: 'primaryKeyConstraints',
  },
  {
    name: 'FOREIGN KEY constraints',
    schema: {} as Schema,
    expectedSnapshot: 'foreignKeyConstraints',
  },
  {
    name: 'UNIQUE constraints',
    schema: {} as Schema,
    expectedSnapshot: 'uniqueConstraints',
  },
  {
    name: 'CHECK constraints',
    schema: {} as Schema,
    expectedSnapshot: 'checkConstraints',
  },
]