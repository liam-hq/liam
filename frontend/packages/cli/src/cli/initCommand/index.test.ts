import fs from 'node:fs'
import path from 'node:path'
import { exit } from 'node:process'
import inquirer from 'inquirer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runInitAction } from './index.js'

describe('InitCommand', () => {
  let consoleInfoSpy: any
  let consoleErrorSpy: any
  let mockExit: any
  let inquirerPromptSpy: any
  let fsMkdirSyncSpy: any
  let fsWriteFileSyncSpy: any

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockExit = vi.fn().mockImplementation(() => {
      throw new Error('Exit called')
    })
    inquirerPromptSpy = vi.spyOn(inquirer, 'prompt')
    fsMkdirSyncSpy = vi
      .spyOn(fs, 'mkdirSync')
      .mockImplementation(() => undefined)
    fsWriteFileSyncSpy = vi
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_postgresql_setup_with_pgdump_success', async () => {
    inquirerPromptSpy
      .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
      .mockResolvedValueOnce({ usePgDump: true })
      .mockResolvedValueOnce({ dumpFilePath: 'my-schema.sql' })
      .mockResolvedValueOnce({ addGhActions: false })

    await runInitAction(mockExit)

    expect(inquirerPromptSpy).toHaveBeenCalledTimes(4)
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Welcome to the @liam-hq/cli setup process'),
    )
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Next Steps'),
    )
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('my-schema.sql'),
    )
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Setup complete'),
    )
  })

  it('test_rails_schema_setup_success', async () => {
    inquirerPromptSpy
      .mockResolvedValueOnce({ dbOrOrm: 'Ruby on Rails (schema.rb)' })
      .mockResolvedValueOnce({ schemaFilePath: 'custom/schema.rb' })
      .mockResolvedValueOnce({ addGhActions: false })

    await runInitAction(mockExit)

    expect(inquirerPromptSpy).toHaveBeenCalledTimes(3)
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Welcome to the @liam-hq/cli setup process'),
    )
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Next Steps'),
    )
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('custom/schema.rb'),
    )
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('--format schemarb'),
    )
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Setup complete'),
    )
  })

  it('test_github_actions_workflow_generation_success', async () => {
    inquirerPromptSpy
      .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
      .mockResolvedValueOnce({ usePgDump: true })
      .mockResolvedValueOnce({ dumpFilePath: 'schema.sql' })
      .mockResolvedValueOnce({ addGhActions: true })

    await runInitAction(mockExit)

    expect(fsMkdirSyncSpy).toHaveBeenCalledWith(
      path.join(process.cwd(), '.github', 'workflows'),
      { recursive: true },
    )
    expect(fsWriteFileSyncSpy).toHaveBeenCalledWith(
      path.join(process.cwd(), '.github', 'workflows', 'erd.yml'),
      expect.stringContaining('name: ERD Build'),
      'utf-8',
    )
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Created GitHub Actions workflow'),
    )
  })

  it('test_unsupported_technology_selection_exits', async () => {
    inquirerPromptSpy.mockResolvedValueOnce({ dbOrOrm: 'Others' })

    await expect(runInitAction(mockExit)).rejects.toThrow('Exit called')

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining("Sorry we don't support them yet"),
    )
    expect(mockExit).toHaveBeenCalledWith(0)
  })

  it('test_github_actions_creation_filesystem_error', async () => {
    inquirerPromptSpy
      .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
      .mockResolvedValueOnce({ usePgDump: true })
      .mockResolvedValueOnce({ dumpFilePath: 'schema.sql' })
      .mockResolvedValueOnce({ addGhActions: true })

    const error = new Error('Permission denied')
    fsMkdirSyncSpy.mockImplementation(() => {
      throw error
    })

    await runInitAction(mockExit)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create GitHub Actions workflow file'),
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Permission denied'),
    )
  })

  it('test_drizzle_non_postgres_unsupported', async () => {
    inquirerPromptSpy
      .mockResolvedValueOnce({ dbOrOrm: 'Drizzle' })
      .mockResolvedValueOnce({ usePostgres: false })

    await expect(runInitAction(mockExit)).rejects.toThrow('Exit called')

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining("Sorry we don't support them yet"),
    )
    expect(mockExit).toHaveBeenCalledWith(0)
  })
})
