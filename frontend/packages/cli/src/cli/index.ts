import path from 'node:path'
import { Command } from 'commander'
import { buildCommand } from './commands/index.js'

const distDir = path.join(process.cwd(), 'dist')

const program = new Command()

program.name('liam').description('CLI tool for Liam').version('0.0.0')

const erdCommand = new Command('erd').description('ERD commands')
program.addCommand(erdCommand)

erdCommand
  .command('build')
  .description('Build ERD html assets')
  .option('--input <path>', 'Path to the .sql file')
  .option('--format <format>', 'Format of the input file')
  .action((options) => buildCommand(options.input, distDir, options.format))

export { program }
