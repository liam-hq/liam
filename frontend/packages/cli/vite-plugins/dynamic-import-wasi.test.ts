import { describe, expect, it, vi } from 'vitest'

describe('remove-import-wasi plugin', () => {
  it('should create plugin with correct name', async () => {
    const { removeImportWasi } = await import('./remove-import-wasi.js')
    const plugin = removeImportWasi()
    
    expect(plugin.name).toBe('remove-import-wasi')
  })

  it('should handle buildEnd hook', async () => {
    const { removeImportWasi } = await import('./remove-import-wasi.js')
    const plugin = removeImportWasi()
    
    expect(plugin.buildEnd).toBeDefined()
    expect(typeof plugin.buildEnd).toBe('function')
  })

  it('should remove WASI imports from build output', async () => {
    const mockReadFileSync = vi.fn().mockReturnValue("import 'wasi';\nconsole.log('test');")
    const mockWriteFileSync = vi.fn()
    
    const mockFs = {
      readFileSync: mockReadFileSync,
      writeFileSync: mockWriteFileSync,
    }
    
    vi.doMock('node:fs', () => ({
      default: mockFs,
      ...mockFs,
    }))
    
    vi.resetModules()
    const { removeImportWasi } = await import('./remove-import-wasi.js')
    const plugin = removeImportWasi()
    
    plugin.buildEnd?.()
    
    expect(mockReadFileSync).toHaveBeenCalledWith('dist-cli/bin/cli.js', 'utf8')
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      'dist-cli/bin/cli.js',
      "console.log('test');",
      'utf8'
    )
    
    vi.doUnmock('node:fs')
  })
})
