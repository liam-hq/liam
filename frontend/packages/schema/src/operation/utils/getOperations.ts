import pkg from 'fast-json-patch'

const { compare } = pkg // see https://github.com/Starcounter-Jack/JSON-Patch/issues/310

import { safeParse } from 'valibot'
import type { Schema } from '../../schema/index.js'
import { type Operation, operationSchema } from '../schema/index.js'

const isOperation = (op: unknown): op is Operation => {
  const parsed = safeParse(operationSchema, op)
  return parsed.success
}

export const getOperations = (before: Schema, after: Schema): Operation[] => {
  const operations = compare(before, after)
  const filteredOperations = operations.filter(isOperation)

  return filteredOperations
}
