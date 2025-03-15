import { supportedFormatSchema } from '@liam-hq/db-structure/parser'
import { Command } from 'commander'
import { actionRunner } from '../actionRunner.js'
import { buildCommand } from './buildCommand/index.js'

const defaultDistDir = 'dist'

const erdCommand = new Command('erd').description('ERD commands')

erdCommand
  .command('build')
  .description('Build ERD html assets')
  .option(
    '--input <path|url>',
    'Path (supports glob patterns) or URL to the schema file(s)',
  )
  .option(
    '--format <format>',
    `Format of the input file (${supportedFormatSchema.options.join('|')})`,
  )
  .option(
    '--output-dir <path>',
    `Output directory for generated files (default: "${defaultDistDir}")`,
    defaultDistDir,
  )
  .action(
    actionRunner((options) =>
      buildCommand(options.input, options.outputDir, options.format),
    ),
  )

export { erdCommand }
