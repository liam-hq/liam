import type { DBStructure } from '../../../schema/index.js'
import { UnexpectedTokenWarningError } from '../../errors.js'
import type { Processor } from '../../types.js'
import { convertToDBStructure } from './converter.js'
import { mergeDBStructures } from './mergeDBStructures.js'
import { parse } from './parser.js'
import { processSQLInChunks } from './processSQLInChunks.js'

export const processor: Processor = async (str: string) => {
  const dbStructure: DBStructure = { tables: {}, relationships: {} }
  const CHUNK_SIZE = 1000
  const errors: Error[] = []

  await processSQLInChunks(str, CHUNK_SIZE, async (chunk) => {
    const { parse_tree, error: parseError } = await parse(chunk)
    if (parseError !== null) {
      errors.push(new UnexpectedTokenWarningError(parseError.message))
    }

    const { value: converted, errors: convertErrors } = convertToDBStructure(
      parse_tree.stmts,
    )
    if (convertErrors !== null) {
      errors.push(...convertErrors)
    }

    mergeDBStructures(dbStructure, converted)
  })

  return { value: dbStructure, errors }
}
