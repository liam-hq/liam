import type { DBStructure } from '../schema/index.js'
import type { ProcessError } from './errors.js'

export type ProcessResult = {
  value: DBStructure
  errors: ProcessError[]
}

export type Processor = (
  str: string,
  serverSideWasmPath?: string,
) => Promise<ProcessResult>
