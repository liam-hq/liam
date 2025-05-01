import { createRequire } from 'node:module'
import { Command } from 'commander'
import { erdCommand } from './erdCommand/index.js'
import { initCommand } from './initCommand/index.js'
import { mcpCommand } from './mcpCommand/index.js'

const program = new Command()

const require = createRequire(import.meta.url)
const { version } = require('../../package.json')

program.name('liam').description('CLI tool for Liam').version(version)
program.addCommand(erdCommand)
program.addCommand(initCommand)
program.addCommand(mcpCommand)
export { program }
