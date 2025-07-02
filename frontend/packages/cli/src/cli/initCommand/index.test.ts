import fs from 'node:fs'
import { exit } from 'node:process'
import type { Command } from 'commander'
import inquirer from 'inquirer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as yocto from 'yoctocolors'
import {
  DbOrmDiscussionUrl,
  DiscussionUrl,
  DocsUrl,
  RepositoryUrl,
} from '../urls.js'
import { initCommand } from './index.js'

// Type for inquirer questions
type InquirerQuestion = {
  name: string
  type?: string
  message?: string
  choices?: string[]
  default?: string | boolean
}

type InquirerQuestions = InquirerQuestion | InquirerQuestion[]

// Type for Command with private action handler
interface CommandWithHandler extends Command {
  _actionHandler?: (...args: unknown[]) => Promise<void>
}

// Mock dependencies
vi.mock('node:fs')
vi.mock('node:process', async () => {
  const actual = await vi.importActual('node:process')
  return {
    ...actual,
    exit: vi.fn(),
  }
})
vi.mock('inquirer')
vi.mock('yoctocolors')
vi.mock('../urls.js', () => ({
  DbOrmDiscussionUrl: 'https://example.com/discussion/db-orm',
  DiscussionUrl: 'https://example.com/discussion',
  DocsUrl: 'https://example.com/docs',
  RepositoryUrl: 'https://example.com/repo',
}))

// Mock console methods
const originalConsoleInfo = console.info
const originalConsoleError = console.error

const mockConsoleInfo = vi.fn()
const mockConsoleError = vi.fn()

// Helper to mock inquirer prompts in sequence
const mockInquirerSequence = (responses: Record<string, unknown>[]) => {
  let callIndex = 0
  return vi
    .mocked(inquirer.prompt)
    .mockImplementation(async (questions: InquirerQuestions) => {
      const questionsList = Array.isArray(questions) ? questions : [questions]
      const name = questionsList[0].name
      const response = responses[callIndex]
      if (response && name in response) {
        callIndex++
        return { [name]: response[name] }
      }
      callIndex++
      return {}
    })
}

describe('initCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleInfo.mockClear()
    mockConsoleError.mockClear()
    console.info = mockConsoleInfo
    console.error = mockConsoleError

    // Set up default yocto color mocks
    vi.mocked(yocto.greenBright).mockImplementation((text) => text as string)
    vi.mocked(yocto.blueBright).mockImplementation((text) => text as string)
    vi.mocked(yocto.yellow).mockImplementation((text) => text as string)
    vi.mocked(yocto.yellowBright).mockImplementation((text) => text as string)
    vi.mocked(yocto.redBright).mockImplementation((text) => text as string)
    vi.mocked(yocto.bold).mockImplementation((text) => text as string)
  })

  afterEach(() => {
    console.info = originalConsoleInfo
    console.error = originalConsoleError
    vi.restoreAllMocks()
  })

  // Helper to run the init command by directly calling its action
  const runInitCommand = async () => {
    // Get the action handler from the command
    const actionHandler = (initCommand as CommandWithHandler)._actionHandler
    if (actionHandler) {
      // Call with empty args and options as Commander would do
      await actionHandler.call(initCommand, [], initCommand)
    }
  }

  describe('command configuration', () => {
    it('should have correct command name and description', () => {
      expect(initCommand.name()).toBe('init')
      expect(initCommand.description()).toBe(
        'guide you interactively through the setup',
      )
    })
  })

  describe('PostgreSQL flow', () => {
    it('should handle PostgreSQL with pg_dump file', async () => {
      mockInquirerSequence([
        { dbOrOrm: 'PostgreSQL' },
        { usePgDump: true },
        { dumpFilePath: 'custom-schema.sql' },
        { addGhActions: false },
      ])

      await runInitCommand()

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('Welcome to the @liam-hq/cli setup process!'),
      )
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(
          'npx @liam-hq/cli erd build --input custom-schema.sql --format postgres',
        ),
      )
    })

    it('should handle PostgreSQL without pg_dump file', async () => {
      mockInquirerSequence([
        { dbOrOrm: 'PostgreSQL' },
        { usePgDump: false },
        { addGhActions: false },
      ])

      await runInitCommand()

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('Please run `pg_dump --schema-only` later'),
      )
    })
  })

  describe('Rails flow', () => {
    it('should handle Ruby on Rails with custom schema path', async () => {
      mockInquirerSequence([
        { dbOrOrm: 'Ruby on Rails (schema.rb)' },
        { schemaFilePath: 'custom/path/schema.rb' },
        { addGhActions: false },
      ])

      await runInitCommand()

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(
          'npx @liam-hq/cli erd build --input custom/path/schema.rb --format schemarb',
        ),
      )
    })

    it('should use default Rails schema path', async () => {
      let defaultChecked = false

      const mockResponses: Record<string, () => Record<string, unknown>> = {
        dbOrOrm: () => ({ dbOrOrm: 'Ruby on Rails (schema.rb)' }),
        schemaFilePath: () => {
          defaultChecked = true
          return { schemaFilePath: 'db/schema.rb' }
        },
        addGhActions: () => ({ addGhActions: false }),
      }

      vi.mocked(inquirer.prompt).mockImplementation(
        async (questions: InquirerQuestions) => {
          const questionsList = Array.isArray(questions)
            ? questions
            : [questions]
          const name = questionsList[0].name

          if (name === 'schemaFilePath') {
            expect(questionsList[0].default).toBe('db/schema.rb')
          }

          return mockResponses[name]?.() || {}
        },
      )

      await runInitCommand()

      expect(defaultChecked).toBe(true)
    })
  })

  describe('Prisma flow', () => {
    it('should handle Prisma with custom schema path', async () => {
      mockInquirerSequence([
        { dbOrOrm: 'Prisma (schema.prisma)' },
        { schemaFilePath: 'custom/prisma/schema.prisma' },
        { addGhActions: false },
      ])

      await runInitCommand()

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(
          'npx @liam-hq/cli erd build --input custom/prisma/schema.prisma --format prisma',
        ),
      )
    })

    it('should use default Prisma schema path', async () => {
      let defaultChecked = false

      const mockResponses: Record<string, () => Record<string, unknown>> = {
        dbOrOrm: () => ({ dbOrOrm: 'Prisma (schema.prisma)' }),
        schemaFilePath: () => {
          defaultChecked = true
          return { schemaFilePath: 'prisma/schema.prisma' }
        },
        addGhActions: () => ({ addGhActions: false }),
      }

      vi.mocked(inquirer.prompt).mockImplementation(
        async (questions: InquirerQuestions) => {
          const questionsList = Array.isArray(questions)
            ? questions
            : [questions]
          const name = questionsList[0].name

          if (name === 'schemaFilePath') {
            expect(questionsList[0].default).toBe('prisma/schema.prisma')
          }

          return mockResponses[name]?.() || {}
        },
      )

      await runInitCommand()

      expect(defaultChecked).toBe(true)
    })
  })

  describe('Drizzle flow', () => {
    it('should handle Drizzle with PostgreSQL', async () => {
      mockInquirerSequence([
        { dbOrOrm: 'Drizzle' },
        { usePostgres: true },
        { addGhActions: false },
      ])

      await runInitCommand()

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('For Drizzle, please run your DB migrations'),
      )
    })

    it('should handle Drizzle without PostgreSQL and exit', async () => {
      mockInquirerSequence([{ dbOrOrm: 'Drizzle' }, { usePostgres: false }])

      await runInitCommand()

      expect(vi.mocked(exit)).toHaveBeenCalledWith(0)
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(
          "For other DBs or ORMs, Sorry we don't support them yet",
        ),
      )
    })
  })

  describe('tbls flow', () => {
    it('should handle direct tbls usage', async () => {
      mockInquirerSequence([
        { dbOrOrm: 'tbls' },
        { schemaFilePath: 'docs/custom-schema.json' },
        { addGhActions: false },
      ])

      await runInitCommand()

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(
          'npx @liam-hq/cli erd build --input docs/custom-schema.json --format tbls',
        ),
      )
    })

    it('should handle MySQL via tbls', async () => {
      mockInquirerSequence([
        { dbOrOrm: 'MySQL (via tbls)' },
        { addGhActions: false },
      ])

      await runInitCommand()

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('Note: Direct support is not available yet'),
      )
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('tbls out -t json -o schema.json'),
      )
    })
  })

  describe('Others flow', () => {
    it('should show unsupported message and exit', async () => {
      mockInquirerSequence([{ dbOrOrm: 'Others' }])

      await runInitCommand()

      expect(vi.mocked(exit)).toHaveBeenCalledWith(0)
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(
          "For other DBs or ORMs, Sorry we don't support them yet",
        ),
      )
    })
  })

  describe('GitHub Actions generation', () => {
    it('should generate GitHub Actions workflow file when requested', async () => {
      const mockMkdirSync = vi.mocked(fs.mkdirSync)
      const mockWriteFileSync = vi.mocked(fs.writeFileSync)

      mockInquirerSequence([
        { dbOrOrm: 'PostgreSQL' },
        { usePgDump: true },
        { dumpFilePath: 'schema.sql' },
        { addGhActions: true },
      ])

      await runInitCommand()

      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.github/workflows'),
        { recursive: true },
      )
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('erd.yml'),
        expect.stringContaining('name: ERD Build'),
        'utf-8',
      )
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('Created GitHub Actions workflow at:'),
      )
    })

    it('should handle GitHub Actions file creation error', async () => {
      const mockMkdirSync = vi.mocked(fs.mkdirSync)
      mockMkdirSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      mockInquirerSequence([
        { dbOrOrm: 'PostgreSQL' },
        { usePgDump: true },
        { dumpFilePath: 'schema.sql' },
        { addGhActions: true },
      ])

      await runInitCommand()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to create GitHub Actions workflow file:',
        ),
      )
    })

    it('should generate GitHub Actions with tbls setup steps', async () => {
      const mockMkdirSync = vi.mocked(fs.mkdirSync)
      const mockWriteFileSync = vi.mocked(fs.writeFileSync)

      mockInquirerSequence([
        { dbOrOrm: 'MySQL (via tbls)' },
        { addGhActions: true },
      ])

      await runInitCommand()

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('erd.yml'),
        expect.stringContaining('Setup tbls'),
        'utf-8',
      )
    })
  })

  describe('formatMap', () => {
    const testCases = [
      { dbOrOrm: 'PostgreSQL', expectedFormat: 'postgres' },
      { dbOrOrm: 'Ruby on Rails (schema.rb)', expectedFormat: 'schemarb' },
      { dbOrOrm: 'Prisma (schema.prisma)', expectedFormat: 'prisma' },
      { dbOrOrm: 'Drizzle', expectedFormat: 'postgres' },
      { dbOrOrm: 'tbls', expectedFormat: 'tbls' },
      { dbOrOrm: 'MySQL (via tbls)', expectedFormat: 'tbls' },
      { dbOrOrm: 'SQLite (via tbls)', expectedFormat: 'tbls' },
      { dbOrOrm: 'BigQuery (via tbls)', expectedFormat: 'tbls' },
    ]

    testCases.forEach(({ dbOrOrm, expectedFormat }) => {
      it(`should map ${dbOrOrm} to format ${expectedFormat}`, async () => {
        // Create fresh mock for each test case
        const responses: Record<string, unknown>[] = [{ dbOrOrm }]

        // Add appropriate responses based on dbOrOrm
        switch (dbOrOrm) {
          case 'PostgreSQL':
            responses.push({ usePgDump: true }, { dumpFilePath: 'test.sql' })
            break
          case 'Drizzle':
            responses.push({ usePostgres: true })
            break
          case 'tbls':
          case 'Ruby on Rails (schema.rb)':
          case 'Prisma (schema.prisma)':
            responses.push({ schemaFilePath: 'test.schema' })
            break
        }

        responses.push({ addGhActions: false })

        mockInquirerSequence(responses)

        await runInitCommand()

        expect(mockConsoleInfo).toHaveBeenCalledWith(
          expect.stringContaining(`--format ${expectedFormat}`),
        )
      })
    })
  })

  describe('welcome message', () => {
    it('should display all required information in welcome message', async () => {
      mockInquirerSequence([{ dbOrOrm: 'Others' }])

      await runInitCommand()

      // Check that all important URLs are displayed
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(DiscussionUrl),
      )
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(RepositoryUrl),
      )
    })
  })

  describe('completion message', () => {
    it('should display completion message after successful setup', async () => {
      mockInquirerSequence([
        { dbOrOrm: 'PostgreSQL' },
        { usePgDump: true },
        { dumpFilePath: 'schema.sql' },
        { addGhActions: false },
      ])

      await runInitCommand()

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('Setup complete! Enjoy using Liam ERD'),
      )
    })
  })
})
