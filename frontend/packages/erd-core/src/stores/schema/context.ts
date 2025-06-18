import { createContext } from 'react'
import type { SchemaContextValue } from './schema'

export const SchemaContext = createContext<SchemaContextValue | null>(null)
