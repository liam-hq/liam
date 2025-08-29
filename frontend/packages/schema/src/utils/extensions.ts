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
 * Normalize extension names for consistent comparison and lookup
 * Handles quoted names, case differences, and separator variations
 *
 * @param extensionName Raw extension name from SQL or other sources
 * @returns Normalized extension name (unquoted, lowercase, with canonical separators)
 */
function normalizeExtensionName(extensionName: string): string {
  let normalized = extensionName.trim()

  // Remove surrounding double quotes if present
  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1)
  }

  // Convert to lowercase for case-insensitive comparison
  normalized = normalized.toLowerCase()

  // Handle separator normalization carefully:
  // - "uuid_ossp" should become "uuid-ossp" (special case for uuid-ossp)
  // - But pg_trgm, auto_explain should keep their underscores (PostgreSQL convention)
  // - For unknown extensions as fallback, convert underscores to hyphens
  if (normalized === 'uuid_ossp') {
    normalized = 'uuid-ossp'
  }

  return normalized
}

/**
 * Extensions supported by PGlite
 * Complete list of extensions available in PGlite
 * All names are stored in normalized form (lowercase, hyphenated)
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
 * Mapping from normalized SQL extension names to JavaScript import names for PGlite
 * This is used when initializing PGlite with extensions
 * Keys are normalized extension names (lowercase, hyphenated)
 */
export const PGLITE_EXTENSION_NAME_MAPPING: Record<string, string> = {
  'uuid-ossp': 'uuid_ossp', // Hyphens become underscores in JavaScript
  vector: 'vector', // pgvector extension uses 'vector' for both SQL and JS
  // Most extensions keep the same name
  // Add more mappings here if needed
}

/**
 * Check if an extension is supported by PGlite
 * Normalizes the extension name before checking to handle quoted names,
 * case differences, and separator variations
 */
export function isPGliteSupportedExtension(extensionName: string): boolean {
  const normalized = normalizeExtensionName(extensionName)
  return PGLITE_SUPPORTED_EXTENSIONS.has(normalized)
}

/**
 * Get the JavaScript import name for a PGlite extension
 * Normalizes the input name to handle quoted names, case differences, and separator variations
 * @param sqlName The SQL extension name (e.g., "uuid-ossp", "UUID_OSSP", '"uuid-ossp"')
 * @returns The JavaScript import name (e.g., "uuid_ossp")
 */
export function getPGliteJavaScriptName(sqlName: string): string {
  const normalized = normalizeExtensionName(sqlName)
  const mapped = PGLITE_EXTENSION_NAME_MAPPING[normalized]

  if (mapped) {
    return mapped
  }

  // For unmapped extensions:
  // - If it's a known supported extension, keep the original normalized form (preserves underscores)
  // - Otherwise, return hyphenated form as fallback (converts underscores to hyphens)
  if (PGLITE_SUPPORTED_EXTENSIONS.has(normalized)) {
    return normalized
  }

  return normalized.replace(/_/g, '-')
}
