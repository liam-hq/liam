import fs from 'node:fs'
import path from 'node:path'
import inquirer from 'inquirer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initCommand } from './index.js'

function setupMocks() {
  vi.mock('inquirer')
  vi.mock('node:fs', () => ({
    default: {
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    },
  }))
  vi.mock('node:path', () => ({
    default: {
      join: vi.fn().mockImplementation((...args) => args.join('/')),
    },
  }))
}

setupMocks()

describe('initCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.info = vi.fn()
  })

  it('should handle PostgreSQL with pg_dump flow correctly', async () => {
    const mockPrompt = vi.mocked(inquirer.prompt)
    mockPrompt
      .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
      .mockResolvedValueOnce({ usePgDump: true })
      .mockResolvedValueOnce({ dumpFilePath: 'schema.sql' })
      .mockResolvedValueOnce({ addGhActions: false })

    await initCommand.parseAsync(['node', 'test', 'init'])

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'npx @liam-hq/cli erd build --input schema.sql --format postgresql',
      ),
    )
  })

  it('should create GitHub Actions workflow when requested', async () => {
    const mockPrompt = vi.mocked(inquirer.prompt)
    mockPrompt
      .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
      .mockResolvedValueOnce({ usePgDump: true })
      .mockResolvedValueOnce({ dumpFilePath: 'schema.sql' })
      .mockResolvedValueOnce({ addGhActions: true })

    const mockFs = vi.mocked(fs)
    const mockPath = vi.mocked(path)
    mockPath.join.mockImplementation((...args) => args.join('/'))

    await initCommand.parseAsync(['node', 'test', 'init'])

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('.github/workflows'),
      expect.any(Object),
    )
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('erd.yml'),
      expect.stringContaining('name: ERD Build'),
      'utf-8',
    )
  })
})
