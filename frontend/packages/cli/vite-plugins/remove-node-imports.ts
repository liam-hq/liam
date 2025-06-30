import type { Plugin } from 'vite'

export function removeNodeImports(): Plugin {
  return {
    name: 'remove-node-imports',
    config(config) {
      config.build = config.build || {}
      config.build.rollupOptions = config.build.rollupOptions || {}

      const existingExternal = config.build.rollupOptions.external
      const externalArray: string[] = []

      if (Array.isArray(existingExternal)) {
        externalArray.push(
          ...existingExternal.filter((item) => typeof item === 'string'),
        )
      } else if (typeof existingExternal === 'string') {
        externalArray.push(existingExternal)
      }

      externalArray.push('node:fs/promises', 'node:url', 'node:wasi', 'wasi')

      config.build.rollupOptions.external = externalArray
    },
  }
}
