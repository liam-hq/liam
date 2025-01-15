import { processor as prismaProcessor } from './prisma/index.js'
import { processor as schemarbProcessor } from './schemarb/index.js'
import { processor as postgresqlProcessor } from './sql/index.js'
import type { SupportedFormat } from './supportedFormat/index.js'
import type { ProcessResult } from './types.js'

export { ProcessError } from './errors.js'
export { setPrismWasmUrl } from './schemarb/index.js'
export {
  supportedFormatSchema,
  type SupportedFormat,
  detectFormat,
} from './supportedFormat/index.js'

export const parse = (
  str: string,
  format: SupportedFormat,
): Promise<ProcessResult> => {
  switch (format) {
    case 'schemarb':
      return schemarbProcessor(str)
    case 'postgres':
      return postgresqlProcessor(str)
    case 'prisma':
      return prismaProcessor(str)
  }
}
