import type { ProcessResult } from '../types.js'
import { processor as mysqlProcessor } from './mysql/index.js'
import { processor as postgresProcessor } from './postgres/index.js'
import { processor as sqliteProcessor } from './sqlite/index.js'

/**
 * Detect database type from Drizzle schema content
 */
const detectDrizzleDbType = (
  schemaContent: string,
): 'postgres' | 'mysql' | 'sqlite' => {
  // Check for MySQL-specific imports
  if (schemaContent.includes('drizzle-orm/mysql-core')) {
    return 'mysql'
  }

  // Check for PostgreSQL-specific imports
  if (schemaContent.includes('drizzle-orm/pg-core')) {
    return 'postgres'
  }

  // Check for SQLite-specific imports
  if (schemaContent.includes('drizzle-orm/sqlite-core')) {
    return 'sqlite'
  }

  // Check for MySQL-specific table functions
  if (
    schemaContent.includes('mysqlTable') ||
    schemaContent.includes('mysqlEnum')
  ) {
    return 'mysql'
  }

  // Check for PostgreSQL-specific table functions
  if (schemaContent.includes('pgTable') || schemaContent.includes('pgEnum')) {
    return 'postgres'
  }

  // Check for SQLite-specific table functions
  if (schemaContent.includes('sqliteTable')) {
    return 'sqlite'
  }

  // Default to PostgreSQL for backward compatibility
  return 'postgres'
}

/**
 * Auto-detecting Drizzle processor that supports PostgreSQL, MySQL, and SQLite
 */
export const processor = async (
  schemaContent: string,
): Promise<ProcessResult> => {
  const dbType = detectDrizzleDbType(schemaContent)

  switch (dbType) {
    case 'mysql':
      return mysqlProcessor(schemaContent)
    case 'sqlite':
      return sqliteProcessor(schemaContent)
    default:
      return postgresProcessor(schemaContent)
  }
}
