import type { Processor } from '../../types.js'
import { convertToDBStructure } from './converter.js'
import { parse } from './parser.js'

export const processor: Processor = (str: string) => {
  const parsed = parse(str)
  return convertToDBStructure(parsed)
}