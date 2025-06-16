import { createContext } from 'react'
import type { SchemaStore } from './schema'

export const SchemaContext = createContext<SchemaStore | null>(null)
