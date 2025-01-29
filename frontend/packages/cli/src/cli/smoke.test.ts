import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { beforeAll, describe, expect, it } from 'vitest'

// NOTE: This CLI smoke test is a preliminary implementation, lacks refinement, and is relatively slow.
// We should explore alternative approaches for testing.

const execAsync = promisify(exec)

beforeAll(async () => {
  await execAsync('rm -rf ./dist-cli/ ./node_modules/.tmp')
  await execAsync('pnpm run build')
}, 60000 /* 60 seconds for setup */)

describe('CLI Smoke Test', () => {
  it('should run the CLI command without errors: `erd`', async () => {
    try {
      const { stdout, stderr } = await execAsync('npx --no-install . help')
      // NOTE: suppress the following warning:
      if (
        !stderr.includes(
          'ExperimentalWarning: WASI is an experimental feature and might change at any time',
        )
      ) {
        expect(stderr).toBe('')
      }
      expect(stdout).toMatchInlineSnapshot(`
        "Usage: liam [options] [command]

        CLI tool for Liam

        Options:
          -V, --version   output the version number
          -h, --help      display help for command

        Commands:
          erd             ERD commands
          init            guide you interactively through the setup
          help [command]  display help for command
        "
      `)
    } catch (error) {
      // Fail the test if an error occurs
      expect(error).toBeNull()
    }
  }, 20000 /* 20 seconds for smoke test */)

  it('should run the CLI command without errors: `erd build`', async () => {
    await execAsync('rm -rf ./dist')
    try {
      const { stdout, stderr } = await execAsync(
        'npx --no-install . erd build --input fixtures/input.schema.rb --format schemarb',
      )
      // NOTE: suppress the following warning:
      if (
        !stderr.includes(
          'ExperimentalWarning: WASI is an experimental feature and might change at any time',
        )
      ) {
        expect(stderr).toBe('')
      }
      expect(stdout).toBe('')
      const { stdout: lsOutput } = await execAsync('ls ./dist')
      expect(lsOutput.trim().length).toBeGreaterThan(0)
    } catch (error) {
      console.error(error)
      // Fail the test if an error occurs
      expect(error).toBeNull()
    } finally {
      await execAsync('rm -rf ./dist')
    }
  }, 20000 /* 20 seconds for smoke test */)
})
