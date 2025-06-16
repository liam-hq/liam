'use client'

import type { PGlite } from '@electric-sql/pglite'

// Result type definition - aligned with pglite-server package
export interface SqlResult {
  sql: string
  result: unknown
  success: boolean
  id: string
  metadata: {
    executionTime: number
    timestamp: string
    affectedRows?: number | undefined
  }
}

// State for DDL section
export interface DDLState {
  ddlInput: string
  results: SqlResult[]
}

// State for DML section (each section is independent)
export interface DMLSection {
  id: string
  dmlInput: string
  results: SqlResult[]
  db: PGlite | null // No longer used with server-side instances
}
