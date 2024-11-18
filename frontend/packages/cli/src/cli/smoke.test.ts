import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { beforeAll, describe, expect, it } from 'vitest'

const execAsync = promisify(exec)

beforeAll(async () => {
  await execAsync('rm -rf ./dist-cli/ ./node_modules/.tmp')
  await execAsync('pnpm run build:cli')
})

describe('CLI Smoke Test', () => {
  it('should run the CLI command without errors', async () => {
    try {
      const { stdout, stderr } = await execAsync('npx --no-install . help')
      expect(stderr).toBe('')
      expect(stdout).toMatchInlineSnapshot(`
        "Usage: liam [options] [command]

        CLI tool for Liam

        Options:
          -V, --version   output the version number
          -h, --help      display help for command

        Commands:
          erd             ERD commands
          help [command]  display help for command
        "
      `)
    } catch (error) {
      // Fail the test if an error occurs
      expect(error).toBeNull()
    }
  })

  it('should run the CLI command without errors', async () => {
    await execAsync('rm -rf ./dist')
    try {
      const { stdout, stderr } = await execAsync(
        'npx --no-install . erd build --input fixtures/input.sql',
      )
      expect(stderr).toBe('')
      expect(stdout).toContain('building for production')
      expect(stdout).toContain('✓ built in')
      const { stdout: lsOutput } = await execAsync('ls ./dist')
      expect(lsOutput.trim().length).toBeGreaterThan(0)
    } catch (error) {
      console.error(error)
      // Fail the test if an error occurs
      expect(error).toBeNull()
    } finally {
      await execAsync('rm -rf ./dist')
    }
  }, 10000 /* 10 seconds for smoke test */)
})