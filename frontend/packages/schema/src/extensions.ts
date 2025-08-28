/**
 * PGlite extension support utilities
 *
 * This module provides comprehensive support for PostgreSQL extensions in PGlite,
 * including extension validation, name mapping, and DDL generation.
 *
 * Extension Name Mapping:
 * When using extensions in PGlite initialization, some names differ from SQL:
 *
 * SQL Name (CREATE EXTENSION) -> JavaScript Import Name (PGlite init):
 * - "uuid-ossp" -> uuid_ossp (hyphen becomes underscore)
 * - "vector" -> vector (pgvector extension, same name in SQL and JS)
 * - Others remain the same (e.g., "hstore" -> hstore)
 *
 * Example:
 * SQL: CREATE EXTENSION "uuid-ossp";
 * JS:  import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
 *      const pg = new PGlite({ extensions: { uuid_ossp } });
 *
 * @see https://pglite.dev/extensions/
 */

/**
 * Extensions supported by PGlite
 * Complete list of extensions available in PGlite
 */
export const PGLITE_SUPPORTED_EXTENSIONS = new Set([
  'live',
  'vector', // pgvector extension
  'amcheck',
  'auto_explain',
  'bloom',
  'btree_gin',
  'btree_gist',
  'citext',
  'cube',
  'earthdistance',
  'fuzzystrmatch',
  'hstore',
  'isn',
  'lo',
  'ltree',
  'pg_ivm',
  'pg_trgm',
  'seg',
  'tablefunc',
  'tcn',
  'tsm_system_rows',
  'tsm_system_time',
  'uuid-ossp', // Note: JavaScript import uses 'uuid_ossp' (underscore)
])

/**
 * Mapping from SQL extension names to JavaScript import names for PGlite
 * This is used when initializing PGlite with extensions
 */
export const PGLITE_EXTENSION_NAME_MAPPING: Record<string, string> = {
  'uuid-ossp': 'uuid_ossp', // Hyphens become underscores in JavaScript
  vector: 'vector', // pgvector extension uses 'vector' for both SQL and JS
  // Most extensions keep the same name
  // Add more mappings here if needed
}

/**
 * Check if an extension is supported by PGlite
 */
export function isPGliteSupportedExtension(extensionName: string): boolean {
  return PGLITE_SUPPORTED_EXTENSIONS.has(extensionName)
}

/**
 * Get the JavaScript import name for a PGlite extension
 * @param sqlName The SQL extension name (e.g., "uuid-ossp")
 * @returns The JavaScript import name (e.g., "uuid_ossp")
 */
export function getPGliteJavaScriptName(sqlName: string): string {
  return PGLITE_EXTENSION_NAME_MAPPING[sqlName] || sqlName
}
