import type { Extension, PGliteInterface } from '@electric-sql/pglite'

export const pgtap: Extension = {
  name: 'pgtap',
  setup: async (pg: PGliteInterface, _emscriptenOpts?: any) => {
    console.log('DEBUG: pgTAP extension setup called')
    try {
      const bundlePath = new URL('../../release/pgtap.tar.gz', import.meta.url)
      console.log('DEBUG: pgTAP bundle path:', bundlePath.href)
      return {
        bundlePath: bundlePath,
      }
    } catch (error) {
      console.error('DEBUG: pgTAP setup error:', error)
      throw error
    }
  }
}