import path from 'node:path'
import { Command } from 'commander'
import { buildCommand, devCommand, previewCommand } from './commands'

const root = path.resolve(__dirname, '../../..')
const publicDir = path.join(process.cwd(), 'public')
const outDir = path.join(process.cwd(), 'dist')

const program = new Command()

program.name('liam').description('CLI tool for Liam').version('0.0.0')

const erdCommand = new Command('erd').description('ERD commands')
program.addCommand(erdCommand)

erdCommand
  .command('build')
  .description('Run Vite build')
  .option('--input <path>', 'Path to the .sql file')
  .action((options) => buildCommand(options.input, publicDir, root, outDir))

erdCommand
  .command('dev')
  .description('Run Vite dev server')
  .option('--input <path>', 'Path to the .sql file')
  .action((options) => devCommand(options.input, publicDir, root))

erdCommand
  .command('preview')
  .description('Preview the production build')
  .action(() => previewCommand(publicDir, root, outDir))

export { program }
