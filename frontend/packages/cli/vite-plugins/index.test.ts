import { describe, expect, it } from 'vitest'

describe('vite-plugins index', () => {
  it('should export plugins', async () => {
    const plugins = await import('./index.js')
    expect(plugins).toBeDefined()
    expect(plugins.removeImportWasi).toBeDefined()
    expect(plugins.setEnvPlugin).toBeDefined()
  })
})
