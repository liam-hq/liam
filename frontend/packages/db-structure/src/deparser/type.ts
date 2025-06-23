import type { Operation } from '../operation/schema/index.js'
import type { Schema } from '../schema/index.js'

type DeparserError = {
  message: string
}

type DeparserResult = {
  value: string
  errors: DeparserError[]
}

export type SchemaDeparser = (schema: Schema) => DeparserResult
export type OperationDeparser = (operation: Operation) => DeparserResult
