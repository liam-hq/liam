import type { SupportedFormat } from './supportedFormat/index.js'
import type { ProcessResult } from './types.js'

export { ProcessError } from './errors.js'
export { setPrismWasmUrl } from './schemarb/index.js'
export {
  detectFormat,
  type SupportedFormat,
  supportedFormatSchema,
} from './supportedFormat/index.js'

// Export PostgreSQL-specific parser
export {
  type PgParseResult,
  parse as pgParse,
} from './sql/postgresql/parser.js'

export const parse = async (
  str: string,
  format: SupportedFormat,
): Promise<ProcessResult> => {
  switch (format) {
    case 'schemarb': {
      const { processor } = await import('./schemarb/index.js')
      return processor(str)
    }
    case 'postgres': {
      const { processor } = await import('./sql/index.js')
      return processor(str)
    }
    case 'prisma': {
      const { processor } = await import('./prisma/index.js')
      return processor(str)
    }
    case 'drizzle': {
      const { processor } = await import('./drizzle/index.js')
      return processor(str)
    }
    case 'tbls': {
      const { processor } = await import('./tbls/index.js')
      return processor(str)
    }
    case 'liam': {
      const { processor } = await import('./liam/index.js')
      return processor(str)
    }
  }
}
