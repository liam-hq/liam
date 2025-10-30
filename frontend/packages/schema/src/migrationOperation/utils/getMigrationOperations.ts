import pkg from 'fast-json-patch'

const { compare } = pkg // see https://github.com/Starcounter-Jack/JSON-Patch/issues/310

import { safeParse } from 'valibot'
import type { Schema } from '../../schema/index.js'
import {
  type MigrationOperation,
  migrationOperationSchema,
} from '../schema/index.js'

const isMigrationOperation = (op: unknown): op is MigrationOperation => {
  const parsed = safeParse(migrationOperationSchema, op)
  return parsed.success
}

export const getMigrationOperations = (
  before: Schema,
  after: Schema,
): MigrationOperation[] => {
  const operations = compare(before, after)
  const filteredOperations = operations.filter(isMigrationOperation)

  return filteredOperations
}
