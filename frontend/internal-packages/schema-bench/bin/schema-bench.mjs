#!/usr/bin/env node
// Thin shim to run the TypeScript CLI via tsx without prebuilding.

import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

function main() {
  const tsxCli = require.resolve('tsx/dist/cli.js')
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const entryTs = path.resolve(__dirname, '../src/cli/index.ts')

  const child = spawn(
    process.execPath,
    [tsxCli, entryTs, ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd(),
    },
  )

  child.on('exit', (code) => process.exit(code ?? 0))
  child.on('error', () => process.exit(1))
}

main()
