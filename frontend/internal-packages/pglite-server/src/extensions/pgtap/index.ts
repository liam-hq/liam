import type { Extension } from '@electric-sql/pglite'

export const pgtap: Extension = {
  name: 'pgtap',
  setup: async () => ({
    bundlePath: new URL('./pgtap.tar.gz', import.meta.url),
  }),
}
