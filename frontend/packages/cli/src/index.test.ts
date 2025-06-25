import { describe, expect, it } from 'vitest'

describe('index', () => {
  it('should export program from cli/index', async () => {
    const indexModule = await import('./index.js')
    expect(indexModule.program).toBeDefined()
    expect(typeof indexModule.program).toBe('object')
  })

  it('should have program with expected CLI properties', async () => {
    const { program } = await import('./index.js')
    expect(program.name()).toBe('liam')
    expect(program.description()).toContain('CLI tool for Liam')
  })

  it('should have erd command', async () => {
    const { program } = await import('./index.js')
    const commands = program.commands
    const erdCommand = commands.find((cmd: any) => cmd.name() === 'erd')
    expect(erdCommand).toBeDefined()
  })

  it('should have init command', async () => {
    const { program } = await import('./index.js')
    const commands = program.commands
    const initCommand = commands.find((cmd: any) => cmd.name() === 'init')
    expect(initCommand).toBeDefined()
  })
})
