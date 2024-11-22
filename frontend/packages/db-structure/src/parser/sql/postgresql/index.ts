import type { Processor } from '../../types.js'
import { convertToDBStructure } from './converter.js'
import { parse } from './parser.js'

export const processor: Processor = async (str: string) => {
  const parsed = await parse(str)
  return convertToDBStructure(parsed)
}
