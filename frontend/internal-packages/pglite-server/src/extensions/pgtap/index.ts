import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Extension } from '@electric-sql/pglite'

export const pgtap: Extension = {
  name: 'pgtap',
  setup: async () => {
    if (process?.cwd) {
      const cwd = process.cwd()

      // 1. Webpack build path (local Next.js builds)
      const nextServerPath = join(
        cwd,
        '.next',
        'server',
        'static',
        'extensions',
        'pgtap.tar.gz',
      )

      if (existsSync(nextServerPath)) {
        return {
          bundlePath: pathToFileURL(nextServerPath),
        }
      }

      // 2. Traced source path (Vercel deployment via outputFileTracingIncludes)
      const tracedPath = join(
        cwd,
        '..',
        '..',
        'internal-packages',
        'pglite-server',
        'src',
        'extensions',
        'pgtap',
        'pgtap.tar.gz',
      )

      if (existsSync(tracedPath)) {
        return {
          bundlePath: pathToFileURL(tracedPath),
        }
      }
    }

    // 3. Source relative path (development and test environments)
    return {
      bundlePath: new URL('./pgtap.tar.gz', import.meta.url),
    }
  },
}
