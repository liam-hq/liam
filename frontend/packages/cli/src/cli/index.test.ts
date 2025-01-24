import { createRequire } from 'node:module'
import type { Command } from 'commander'
import { describe, expect, it, vi } from 'vitest'
import { program } from './index.js'

// Function to set up mocks
function setupMocks() {
  vi.mock('./commands/buildCommand', () => ({
    buildCommand: vi.fn(),
  }))
}

// Utility function to find a subcommand
function findSubCommand(erdCommand: Command | undefined, name: string) {
  return erdCommand?.commands.find((cmd: Command) => cmd.name() === name)
}

setupMocks()

describe('program', () => {
  it('should have the correct name and description', () => {
    expect(program.name()).toBe('liam')
    expect(program.description()).toBe('CLI tool for Liam')
    const require = createRequire(import.meta.url)
    const { version: packageVersion } = require('../../package.json')
    expect(program.version()).toBe(packageVersion)
  })

  it('should have an "erd" command with subcommands', () => {
    const erdCommand = program.commands.find((cmd) => cmd.name() === 'erd')
    expect(erdCommand).toBeDefined()
    expect(erdCommand?.description()).toBe('ERD commands')

    // Verify subcommands
    const buildSubCommand = findSubCommand(erdCommand, 'build')
    expect(buildSubCommand).toBeDefined()
    expect(buildSubCommand?.description()).toBe('Build ERD html assets')

    const inputOption = buildSubCommand?.options.find(
      (option) => option.name() === 'input',
    )
    expect(inputOption).toBeDefined()
    expect(inputOption?.flags).toBe('--input <path|url>')
    expect(inputOption?.description).toBe(
      'Path (supports glob patterns) or URL to the schema file(s)',
    )

    const formatOption = buildSubCommand?.options.find(
      (option) => option.name() === 'format',
    )
    expect(formatOption).toBeDefined()
    expect(formatOption?.flags).toBe('--format <format>')
    expect(formatOption?.description).toBe(
      'Format of the input file (schemarb|postgres|prisma|tbls)',
    )
  })

  it('should have an "init" command with subcommands', () => {
    const initCommand = program.commands.find((cmd) => cmd.name() === 'init')
    expect(initCommand).toBeDefined()
    expect(initCommand?.description()).toBe(
      'guide you interactively through the setup',
    )
  })
})
