import type { DBStructure } from '../schema'

export type Processor = (str: string) => DBStructure | Promise<DBStructure>
