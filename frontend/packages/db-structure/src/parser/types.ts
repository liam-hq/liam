import type { DBStructure } from '../schema/index.js'

export type Processor = (str: string) => DBStructure | Promise<DBStructure>
