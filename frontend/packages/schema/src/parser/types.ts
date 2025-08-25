import type { Schema } from '../schema/index.js'
import type { ProcessError } from './errors.js'

export type ProcessResult = {
  value: Schema
  errors: ProcessError[]
}

export type Processor = (
  str: string,
  chunkSize?: number,
) => Promise<ProcessResult>
