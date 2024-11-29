import type { DBStructure } from 'src/schema/index.js'
import { processor as schemarbPrismProcessor } from './schemarb-prism/index.js'
import { processor as schemarbProcessor } from './schemarb/index.js'
import { processor as postgresqlProcessor } from './sql/index.js'

type SupportedFormat = 'schemarb' | 'postgres' | 'schemarb-prism'

// TODO: Add error handling and tests
export const parse = (
  str: string,
  format: SupportedFormat,
): Promise<DBStructure> | DBStructure => {
  switch (format) {
    case 'schemarb':
      return schemarbProcessor(str)
    case 'schemarb-prism':
      return schemarbPrismProcessor(str)
    case 'postgres':
      return postgresqlProcessor(str)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}
