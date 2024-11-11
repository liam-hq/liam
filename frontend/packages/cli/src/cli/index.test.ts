import { describe, expect, it, vi } from 'vitest'
import { program } from '.'
import { buildCommand, devCommand, previewCommand } from './commands'

vi.mock('./commands/buildCommand', () => ({
  buildCommand: vi.fn(),
}))
vi.mock('./commands/devCommand', () => ({
  devCommand: vi.fn(),
}))
vi.mock('./commands/previewCommand', () => ({
  previewCommand: vi.fn(),
}))

describe('program', () => {
  it('should have the correct name and description', () => {
    expect(program.name()).toBe('liam')
    expect(program.description()).toBe('CLI tool for Liam')
  })

  it('should have an "erd" command with subcommands', () => {
    const erdCommand = program.commands.find((cmd) => cmd.name() === 'erd')
    expect(erdCommand).toBeDefined()
    expect(erdCommand?.description()).toBe('ERD commands')

    // `build` sub command
    const buildSubCommand = erdCommand?.commands.find(
      (cmd) => cmd.name() === 'build',
    )
    expect(buildSubCommand).toBeDefined()
    expect(buildSubCommand?.description()).toBe('Run Vite build')

    // `dev` sub command
    const devSubCommand = erdCommand?.commands.find(
      (cmd) => cmd.name() === 'dev',
    )
    expect(devSubCommand).toBeDefined()
    expect(devSubCommand?.description()).toBe('Run Vite dev server')

    // `preview` sub command
    const previewSubCommand = erdCommand?.commands.find(
      (cmd) => cmd.name() === 'preview',
    )
    expect(previewSubCommand).toBeDefined()
    expect(previewSubCommand?.description()).toBe(
      'Preview the production build',
    )
  })

  describe('build', () => {
    it('should call buildCommand when "build" command is executed', () => {
      program.parse(['erd', 'build', '--input', 'path/to/file.sql'], {
        from: 'user',
      })
      expect(buildCommand).toHaveBeenCalledWith(
        'path/to/file.sql', // input
        expect.stringMatching(/\/public$/), // publicDir
        expect.any(String), // root
        expect.stringMatching(/\/dist$/), // outDir
      )
    })
  })

  describe('dev', () => {
    it('should call devCommand when "dev" command is executed', () => {
      program.parse(['erd', 'dev', '--input', 'path/to/file.sql'], {
        from: 'user',
      })
      expect(devCommand).toHaveBeenCalledWith(
        'path/to/file.sql', // input
        expect.stringMatching(/\/public$/), // publicDir
        expect.any(String), // root
      )
    })
  })

  describe('preview', () => {
    it('should call previewCommand when "preview" command is executed', () => {
      program.parse(['erd', 'preview'], { from: 'user' })
      expect(previewCommand).toHaveBeenCalledWith(
        expect.stringMatching(/\/public$/), // publicDir
        expect.any(String), // root
        expect.stringMatching(/\/dist$/), // outDir
      )
    })
  })
})
