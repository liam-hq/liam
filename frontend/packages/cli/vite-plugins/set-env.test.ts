import { describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    execSync: vi.fn().mockReturnValue('mock-output'),
  }
})

vi.mock('vite', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadEnv: vi.fn().mockReturnValue({
      npm_package_version: '1.0.0',
    }),
  }
})

describe('set-env plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.VITE_CLI_VERSION_VERSION
    delete process.env.VITE_CLI_VERSION_ENV_NAME
    delete process.env.VITE_CLI_VERSION_GIT_HASH
    delete process.env.VITE_CLI_VERSION_DATE
    delete process.env.VITE_CLI_VERSION_IS_RELEASED_GIT_HASH
  })

  it('should create plugin with correct name', async () => {
    const { setEnvPlugin } = await import('./set-env.js')
    const plugin = setEnvPlugin()
    
    expect(plugin.name).toBe('set-env')
  })

  it('should handle config hook', async () => {
    const { setEnvPlugin } = await import('./set-env.js')
    const plugin = setEnvPlugin()
    
    expect(plugin.config).toBeDefined()
    expect(typeof plugin.config).toBe('function')
  })

  it('should set environment variables', async () => {
    const { setEnvPlugin } = await import('./set-env.js')
    const plugin = setEnvPlugin()
    
    plugin.config?.({}, { command: 'build', mode: 'production' })
    
    expect(process.env.VITE_CLI_VERSION_VERSION).toBe('1.0.0')
    expect(process.env.VITE_CLI_VERSION_ENV_NAME).toBeDefined()
    expect(process.env.VITE_CLI_VERSION_GIT_HASH).toBeDefined()
    expect(process.env.VITE_CLI_VERSION_DATE).toBeDefined()
    expect(process.env.VITE_CLI_VERSION_IS_RELEASED_GIT_HASH).toBeDefined()
  })

  it('should handle different modes', async () => {
    const { setEnvPlugin } = await import('./set-env.js')
    const plugin = setEnvPlugin()
    
    plugin.config?.({}, { command: 'serve', mode: 'development' })
    
    expect(process.env.VITE_CLI_VERSION_ENV_NAME).toBeDefined()
    expect(process.env.VITE_CLI_VERSION_GIT_HASH).toBeDefined()
    expect(process.env.VITE_CLI_VERSION_DATE).toBeDefined()
  })
})
