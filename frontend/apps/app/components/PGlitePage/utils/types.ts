'use client'

import type { PGlite } from '@electric-sql/pglite'

// Result type definition
export interface SqlResult {
  sql: string
  result: { error?: string } | Record<string, unknown>
  success: boolean
  id: string
  // Fields for future extensions
  metadata?: {
    executionTime?: number // Execution time (milliseconds)
    affectedRows?: number // Number of affected rows
    timestamp?: string // Execution timestamp
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
  db: PGlite | null // Each DML section has its own PGlite instance
}
