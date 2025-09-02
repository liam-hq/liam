import type { Extensions } from '@electric-sql/pglite'

// Extract the value type from Extensions to ensure type safety
type ExtensionModule = Extensions[string]

/**
 * Normalize extension name to match PGlite supported format
 */
function normalizeExtensionName(name: string): string {
  const normalized = name.toLowerCase().trim()
  // Special case: uuid-ossp needs to be converted to uuid_ossp for PGlite import
  return normalized === 'uuid-ossp' ? 'uuid_ossp' : normalized
}

/**
 * Dynamically load extension module by name using switch statement
 *
 * NOTE: We use switch instead of dynamic paths because bundlers (Webpack/Next.js)
 * cannot statically analyze `await import(variablePath)` and fail at runtime.
 * Each case must use a literal string path for static analysis to work.
 */
async function loadExtensionModule(
  extensionName: string,
): Promise<ExtensionModule | null> {
  try {
    switch (extensionName) {
      case 'live': {
        const module = await import('@electric-sql/pglite/live')
        return module.live
      }
      case 'pg_ivm': {
        const module = await import('@electric-sql/pglite/pg_ivm')
        return module.pg_ivm
      }
      case 'uuid_ossp': {
        const module = await import('@electric-sql/pglite/contrib/uuid_ossp')
        return module.uuid_ossp
      }
      case 'hstore': {
        const module = await import('@electric-sql/pglite/contrib/hstore')
        return module.hstore
      }
      case 'pg_trgm': {
        const module = await import('@electric-sql/pglite/contrib/pg_trgm')
        return module.pg_trgm
      }
      case 'btree_gin': {
        const module = await import('@electric-sql/pglite/contrib/btree_gin')
        return module.btree_gin
      }
      case 'btree_gist': {
        const module = await import('@electric-sql/pglite/contrib/btree_gist')
        return module.btree_gist
      }
      case 'citext': {
        const module = await import('@electric-sql/pglite/contrib/citext')
        return module.citext
      }
      case 'ltree': {
        const module = await import('@electric-sql/pglite/contrib/ltree')
        return module.ltree
      }
      case 'vector': {
        const module = await import('@electric-sql/pglite/vector')
        return module.vector
      }
      case 'amcheck': {
        const module = await import('@electric-sql/pglite/contrib/amcheck')
        return module.amcheck
      }
      case 'auto_explain': {
        const module = await import('@electric-sql/pglite/contrib/auto_explain')
        return module.auto_explain
      }
      case 'bloom': {
        const module = await import('@electric-sql/pglite/contrib/bloom')
        return module.bloom
      }
      case 'cube': {
        const module = await import('@electric-sql/pglite/contrib/cube')
        return module.cube
      }
      case 'earthdistance': {
        const module = await import(
          '@electric-sql/pglite/contrib/earthdistance'
        )
        return module.earthdistance
      }
      case 'fuzzystrmatch': {
        const module = await import(
          '@electric-sql/pglite/contrib/fuzzystrmatch'
        )
        return module.fuzzystrmatch
      }
      case 'isn': {
        const module = await import('@electric-sql/pglite/contrib/isn')
        return module.isn
      }
      case 'lo': {
        const module = await import('@electric-sql/pglite/contrib/lo')
        return module.lo
      }
      case 'seg': {
        const module = await import('@electric-sql/pglite/contrib/seg')
        return module.seg
      }
      case 'tablefunc': {
        const module = await import('@electric-sql/pglite/contrib/tablefunc')
        return module.tablefunc
      }
      case 'tcn': {
        const module = await import('@electric-sql/pglite/contrib/tcn')
        return module.tcn
      }
      case 'tsm_system_rows': {
        const module = await import(
          '@electric-sql/pglite/contrib/tsm_system_rows'
        )
        return module.tsm_system_rows
      }
      case 'tsm_system_time': {
        const module = await import(
          '@electric-sql/pglite/contrib/tsm_system_time'
        )
        return module.tsm_system_time
      }
      default:
        return null
    }
  } catch (error) {
    console.error(
      `Failed to dynamically import extension ${extensionName}:`,
      error,
    )
    return null
  }
}

/**
 * Load and filter extensions for PGlite
 * Returns both the extension modules object and the list of supported extension names
 */
export async function loadExtensions(requiredExtensions: string[]): Promise<{
  extensionModules: Extensions
  supportedExtensionNames: string[]
}> {
  const extensionModules: Extensions = {}
  const supportedExtensionNames: string[] = []

  for (const ext of requiredExtensions) {
    const normalizedExt = normalizeExtensionName(ext)

    // Try to dynamically load the extension module
    const extensionModule = await loadExtensionModule(normalizedExt)

    if (extensionModule) {
      try {
        extensionModules[normalizedExt] = extensionModule
        supportedExtensionNames.push(ext) // Add original extension name to supported list
      } catch (error) {
        console.error(`Failed to configure extension ${normalizedExt}:`, error)
      }
    }
    // Silently exclude unsupported extensions - they will be reported in the summary
  }

  return { extensionModules, supportedExtensionNames }
}

/**
 * Filter CREATE EXTENSION statements to only include supported extensions
 */
export function filterExtensionDDL(
  sql: string,
  supportedExtensions: string[],
): string {
  // Create a Set of normalized supported extensions for efficient lookup
  const normalizedSupported = new Set(
    supportedExtensions.map((ext) => normalizeExtensionName(ext)),
  )

  // Pass 1: grab full statements cheaply; Pass 2: extract and simplify
  const stmtRegex = /CREATE\s+EXTENSION\b[^;]*;/gi
  return sql.replace(stmtRegex, (stmt) => {
    const m = stmt.match(
      /CREATE\s+EXTENSION\s+((?:IF\s+NOT\s+EXISTS\s+)?["']?[^"'\s;]+["']?)/i,
    )
    const extensionPart = m?.[1] // e.g., "IF NOT EXISTS pg_ivm" or "hstore"
    if (!extensionPart) return stmt

    // Extract just the extension name for normalization check
    const nameMatch = extensionPart.match(
      /(?:IF\s+NOT\s+EXISTS\s+)?["']?([^"'\s;]+)["']?/,
    )
    const extensionName = nameMatch?.[1]
    if (!extensionName) return stmt

    const normalizedExt = normalizeExtensionName(extensionName)

    // Check if extension is in our supported list (dynamic import handled extensions)
    if (normalizedSupported.has(normalizedExt)) {
      // Return simplified CREATE EXTENSION statement without WITH/CASCADE clauses
      return `CREATE EXTENSION ${extensionPart};`
    }

    return ''
  })
}
