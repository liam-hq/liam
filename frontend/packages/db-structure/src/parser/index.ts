import * as v from 'valibot'
import { processor as schemarbProcessor } from './schemarb/index.js'
import { processor as postgresqlProcessor } from './sql/index.js'
import type { ProcessResult } from './types.js'

export const supportedFormatSchema = v.union([
  v.literal('schemarb'),
  v.literal('postgres'),
])

export type SupportedFormat = v.InferOutput<typeof supportedFormatSchema>

export const parse = (
  str: string,
  format: SupportedFormat,
  serverSideWasmPath?: string,
): Promise<ProcessResult> => {
  switch (format) {
    case 'schemarb':
      return schemarbProcessor(str, serverSideWasmPath)
    case 'postgres':
      return postgresqlProcessor(str)
  }
}
