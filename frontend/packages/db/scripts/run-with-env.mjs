// Workaround to load .env in Prisma or Suapbase CLI.
// If `-env-file` can be specified in NODE_OPTIONS, this file will no longer be needed.
// @see: https://github.com/nodejs/node/issues/51147
import { spawn } from 'node:child_process'

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error(
    'Usage: node --env-file=.env run-with-env.mjs <command> [args...]',
  )
  process.exit(1)
}

const [command, ...commandArgs] = args

const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  shell: true,
})

child.on('error', (error) => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})

child.on('close', (code) => {
  process.exit(code)
})
