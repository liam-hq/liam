import { exec } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { beforeAll, describe, expect, it } from 'vitest'
import { blueBright } from 'yoctocolors'

const cliPackageDir = resolve(process.cwd(), 'frontend/packages/cli')

// NOTE: This CLI smoke test is a preliminary implementation, lacks refinement, and is relatively slow.
// We should explore alternative approaches for testing.

const execAsync = promisify(exec)

beforeAll(async () => {
  await execAsync('rm -rf ./dist-cli/ ./node_modules/.tmp', {
    cwd: cliPackageDir,
  })
  await execAsync('pnpm run build', { cwd: cliPackageDir })
}, 60000 /* 60 seconds for setup */)

describe.skip('CLI Smoke Test', () => {
  it('should run the CLI command without errors: `erd`', async () => {
    try {
      const { stdout, stderr } = await execAsync(
        'node ./dist-cli/bin/cli.js help',
        {
          cwd: cliPackageDir,
        },
      )

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
    await execAsync('rm -rf ./dist', { cwd: cliPackageDir })

    try {
      const { stdout, stderr } = await execAsync(
        'node ./dist-cli/bin/cli.js erd build --input fixtures/input.schema.rb --format schemarb',
        { cwd: cliPackageDir },
      )
      // NOTE: suppress the following warning:
      if (
        !stderr.includes(
          'ExperimentalWarning: WASI is an experimental feature and might change at any time',
        )
      ) {
        expect(stderr).toBe('')
      }

      expect(stdout).toBe(`
ERD has been generated successfully in the \`dist/\` directory.
Note: You cannot open this file directly using \`file://\`.
Please serve the \`dist/\` directory with an HTTP server and access it via \`http://\`.
Example:
    ${blueBright('$ npx http-server dist/')}

`)

      const { stdout: lsOutput } = await execAsync('ls ./dist', {
        cwd: cliPackageDir,
      })
      expect(lsOutput.trim().length).toBeGreaterThan(0)
    } catch (error) {
      console.error(error)
      // Fail the test if an error occurs
      expect(error).toBeNull()
    } finally {
      await execAsync('rm -rf ./dist', { cwd: cliPackageDir })
    }
  }, 20000 /* 20 seconds for smoke test */)
})
