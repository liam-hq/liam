import type { Extensions } from '@electric-sql/pglite'

// Extract the value type from Extensions to ensure type safety
type ExtensionModule = Extensions[string]

// Mapping of extension names to their import paths
const EXTENSION_IMPORT_PATHS: Record<string, string> = {
  live: '@electric-sql/pglite/live',
  vector: '@electric-sql/pglite/vector',
  pg_ivm: '@electric-sql/pglite/pg_ivm',
  amcheck: '@electric-sql/pglite/contrib/amcheck',
  auto_explain: '@electric-sql/pglite/contrib/auto_explain',
  bloom: '@electric-sql/pglite/contrib/bloom',
  btree_gin: '@electric-sql/pglite/contrib/btree_gin',
  btree_gist: '@electric-sql/pglite/contrib/btree_gist',
  citext: '@electric-sql/pglite/contrib/citext',
  cube: '@electric-sql/pglite/contrib/cube',
  earthdistance: '@electric-sql/pglite/contrib/earthdistance',
  fuzzystrmatch: '@electric-sql/pglite/contrib/fuzzystrmatch',
  hstore: '@electric-sql/pglite/contrib/hstore',
  isn: '@electric-sql/pglite/contrib/isn',
  lo: '@electric-sql/pglite/contrib/lo',
  ltree: '@electric-sql/pglite/contrib/ltree',
  pg_trgm: '@electric-sql/pglite/contrib/pg_trgm',
  seg: '@electric-sql/pglite/contrib/seg',
  tablefunc: '@electric-sql/pglite/contrib/tablefunc',
  tcn: '@electric-sql/pglite/contrib/tcn',
  tsm_system_rows: '@electric-sql/pglite/contrib/tsm_system_rows',
  tsm_system_time: '@electric-sql/pglite/contrib/tsm_system_time',
  uuid_ossp: '@electric-sql/pglite/contrib/uuid_ossp',
}

/**
 * Normalize extension name to match PGlite supported format
 */
function normalizeExtensionName(name: string): string {
  const normalized = name.toLowerCase().trim()
  // Special case: uuid-ossp needs to be converted to uuid_ossp for PGlite import
  return normalized === 'uuid-ossp' ? 'uuid_ossp' : normalized
}

/**
 * Dynamically load extension module by name
 */
async function loadExtensionModule(
  extensionName: string,
): Promise<ExtensionModule | null> {
  const importPath = EXTENSION_IMPORT_PATHS[extensionName]
  if (!importPath) {
    return null
  }

  try {
    const module = await import(importPath)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const extensionExport = module[extensionName]
    return extensionExport || null
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
 * Returns both the Extensions object and the list of actually supported extensions
 */
export async function loadExtensions(
  requiredExtensions: string[],
): Promise<{ extensions: Extensions; supportedExtensions: string[] }> {
  const extensions: Extensions = {}
  const supportedExtensions: string[] = []

  for (const ext of requiredExtensions) {
    const normalizedExt = normalizeExtensionName(ext)

    // Try to dynamically load the extension module
    const extensionModule = await loadExtensionModule(normalizedExt)

    if (extensionModule) {
      try {
        extensions[normalizedExt] = extensionModule
        supportedExtensions.push(ext) // Add original extension name to supported list
      } catch (error) {
        console.error(`Failed to configure extension ${normalizedExt}:`, error)
      }
    } else {
      console.warn(
        `Extension '${ext}' is not supported in PGlite environment and will be excluded`,
      )
    }
  }

  if (supportedExtensions.length !== requiredExtensions.length) {
    console.info(
      `Filtered extensions: ${supportedExtensions.join(', ')} (${supportedExtensions.length}/${requiredExtensions.length} supported)`,
    )
  }

  return { extensions, supportedExtensions }
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

  // Pattern to match CREATE EXTENSION statements
  const createExtensionRegex =
    /CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?([^"'\s;]+)["']?/gi

  return sql.replace(createExtensionRegex, (match, extensionName) => {
    const normalizedExt = normalizeExtensionName(extensionName)
    // Check if extension is in our supported list (dynamic import handled extensions)
    if (normalizedSupported.has(normalizedExt)) {
      return match // Keep the statement
    }
    // Comment out unsupported extension
    return `-- Excluded (not supported in PGlite): ${match}`
  })
}
