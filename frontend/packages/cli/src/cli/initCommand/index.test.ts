import fs from 'node:fs'
import path from 'node:path'
import inquirer from 'inquirer'
import { describe, expect, it, vi } from 'vitest'

vi.mock('node:fs')
vi.mock('inquirer')
vi.mock('node:process', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    cwd: vi.fn(() => '/test/cwd'),
  }
})

describe('initCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('PostgreSQL flow', () => {
    it('should handle PostgreSQL with pg_dump', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
        .mockResolvedValueOnce({ usePgDump: true })
        .mockResolvedValueOnce({ dumpFilePath: 'custom.sql' })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(inquirer.prompt).toHaveBeenCalledTimes(4)
    })

    it('should handle PostgreSQL without pg_dump', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
        .mockResolvedValueOnce({ usePgDump: false })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(inquirer.prompt).toHaveBeenCalledTimes(3)
    })
  })

  describe('Drizzle flow', () => {
    it('should handle Drizzle with PostgreSQL', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'Drizzle' })
        .mockResolvedValueOnce({ usePostgres: true })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(inquirer.prompt).toHaveBeenCalledTimes(3)
    })

    it('should handle Drizzle without PostgreSQL', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit called with ${code}`)
      })

      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'Drizzle' })
        .mockResolvedValueOnce({ usePostgres: false })

      vi.resetModules()
      const { initCommand } = await import('./index.js')
      
      await expect(initCommand.parseAsync([], { from: 'user' })).rejects.toThrow('process.exit called with 0')
      expect(exitSpy).toHaveBeenCalledWith(0)
    })
  })

  describe('Rails and Prisma flow', () => {
    it('should handle Ruby on Rails', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'Ruby on Rails (schema.rb)' })
        .mockResolvedValueOnce({ schemaFilePath: 'db/schema.rb' })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(inquirer.prompt).toHaveBeenCalledTimes(3)
    })

    it('should handle Prisma', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'Prisma (schema.prisma)' })
        .mockResolvedValueOnce({ schemaFilePath: 'prisma/schema.prisma' })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(inquirer.prompt).toHaveBeenCalledTimes(3)
    })
  })

  describe('tbls flow', () => {
    it('should handle tbls', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'tbls' })
        .mockResolvedValueOnce({ schemaFilePath: 'docs/schema.json' })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(inquirer.prompt).toHaveBeenCalledTimes(3)
    })

    it('should handle MySQL via tbls', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'MySQL (via tbls)' })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(inquirer.prompt).toHaveBeenCalledTimes(2)
    })

    it('should handle SQLite via tbls', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'SQLite (via tbls)' })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(inquirer.prompt).toHaveBeenCalledTimes(2)
    })

    it('should handle BigQuery via tbls', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'BigQuery (via tbls)' })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(inquirer.prompt).toHaveBeenCalledTimes(2)
    })
  })

  describe('Others flow', () => {
    it('should handle Others selection', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit called with ${code}`)
      })

      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'Others' })

      vi.resetModules()
      const { initCommand } = await import('./index.js')
      
      await expect(initCommand.parseAsync([], { from: 'user' })).rejects.toThrow('process.exit called with 0')
      expect(exitSpy).toHaveBeenCalledWith(0)
    })
  })

  describe('GitHub Actions generation', () => {
    it('should generate GitHub Actions workflow when requested', async () => {
      vi.mocked(fs.mkdirSync).mockImplementation(() => {})
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})
      
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
        .mockResolvedValueOnce({ usePgDump: true })
        .mockResolvedValueOnce({ dumpFilePath: 'schema.sql' })
        .mockResolvedValueOnce({ addGhActions: true })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.join(process.cwd(), '.github', 'workflows'),
        { recursive: true }
      )
      expect(fs.writeFileSync).toHaveBeenCalled()
    })

    it('should handle GitHub Actions generation error', async () => {
      vi.mocked(fs.mkdirSync).mockImplementation(() => {
        throw new Error('Permission denied')
      })
      
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
        .mockResolvedValueOnce({ usePgDump: true })
        .mockResolvedValueOnce({ dumpFilePath: 'schema.sql' })
        .mockResolvedValueOnce({ addGhActions: true })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(console.error).toHaveBeenCalled()
    })

    it('should generate workflow with tbls setup steps', async () => {
      vi.mocked(fs.mkdirSync).mockImplementation(() => {})
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})
      
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'MySQL (via tbls)' })
        .mockResolvedValueOnce({ addGhActions: true })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(fs.writeFileSync).toHaveBeenCalled()
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const workflowContent = writeCall[1] as string
      expect(workflowContent).toContain('Setup tbls')
      expect(workflowContent).toContain('Generate schema.json')
    })

    it('should not generate GitHub Actions when not requested', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
        .mockResolvedValueOnce({ usePgDump: false })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(fs.mkdirSync).not.toHaveBeenCalled()
      expect(fs.writeFileSync).not.toHaveBeenCalled()
    })
  })

  describe('format mapping', () => {
    it('should map PostgreSQL to postgres format', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'PostgreSQL' })
        .mockResolvedValueOnce({ usePgDump: false })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('--format postgres')
      )
    })

    it('should map Ruby on Rails to schemarb format', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'Ruby on Rails (schema.rb)' })
        .mockResolvedValueOnce({ schemaFilePath: 'db/schema.rb' })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('--format schemarb')
      )
    })

    it('should map Prisma to prisma format', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'Prisma (schema.prisma)' })
        .mockResolvedValueOnce({ schemaFilePath: 'prisma/schema.prisma' })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('--format prisma')
      )
    })

    it('should map Drizzle to postgres format', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'Drizzle' })
        .mockResolvedValueOnce({ usePostgres: true })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('--format postgres')
      )
    })

    it('should map tbls variants to tbls format', async () => {
      vi.mocked(inquirer.prompt)
        .mockResolvedValueOnce({ dbOrOrm: 'tbls' })
        .mockResolvedValueOnce({ schemaFilePath: 'docs/schema.json' })
        .mockResolvedValueOnce({ addGhActions: false })

      const { initCommand } = await import('./index.js')
      await initCommand.parseAsync([], { from: 'user' })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('--format tbls')
      )
    })
  })
})
