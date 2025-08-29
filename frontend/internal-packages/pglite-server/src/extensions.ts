/**
 * PGlite extension loading utilities
 *
 * This module handles dynamic loading of PGlite extensions based on schema requirements.
 * It maps SQL extension names to their JavaScript imports and provides them to PGlite.
 */

import type { Schema } from '@liam-hq/schema'
// Import the shared extension utilities from the schema package
import {
  getPGliteJavaScriptName,
  isPGliteSupportedExtension as isExtensionSupportedFromSchema,
} from '@liam-hq/schema'

// Type definition for PGlite extensions configuration
// Using unknown for extension modules as they can have various shapes
export type PGliteExtensions = Record<string, unknown>

/**
 * Extract required extensions from a schema
 */
export function extractRequiredExtensions(
  schema: Schema | undefined,
): string[] {
  if (!schema?.extensions) {
    return []
  }

  return Object.values(schema.extensions).map((ext) => ext.name)
}

/**
 * Check if an extension is supported by PGlite
 * Re-exports the function from the schema package for consistency
 */
export function isExtensionSupported(extensionName: string): boolean {
  return isExtensionSupportedFromSchema(extensionName)
}

/**
 * Get configuration info for initializing PGlite with extensions
 *
 * This returns information about what extensions would need to be imported
 * and configured for PGlite initialization.
 *
 * @param extensions Array of SQL extension names
 * @returns Object with import instructions and configuration
 */
export function getExtensionConfiguration(extensions: string[]): {
  imports: Record<string, string>
  config: Record<string, string>
  unsupported: string[]
} {
  const imports: Record<string, string> = {}
  const config: Record<string, string> = {}
  const unsupported: string[] = []

  for (const extensionName of extensions) {
    if (!isExtensionSupported(extensionName)) {
      unsupported.push(extensionName)
      continue
    }

    const jsName = getPGliteJavaScriptName(extensionName)

    // Generate import statement using the unified mapping system
    imports[jsName] =
      `import { ${jsName} } from '@electric-sql/pglite/contrib/${jsName}'`
    config[jsName] = jsName
  }

  return { imports, config, unsupported }
}
