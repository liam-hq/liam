import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SupportedFormat } from '@liam-hq/db-structure/parser'
import { type CliError, FileSystemError } from '../../errors.js'
import { runPreprocess } from '../runPreprocess.js'

export const buildCommand = async (
  inputPath: string,
  outDir: string,
  format: SupportedFormat,
): Promise<CliError[]> => {
  // generate schema.json
  const { errors: preprocessErrors } = await runPreprocess(
    inputPath,
    outDir,
    format,
  )
  if (preprocessErrors.length > 0) {
    return preprocessErrors
  }

  // generate index.html
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const cliHtmlPath = resolve(__dirname, '../html')
  const errors: CliError[] = []

  // Check if the source directory exists
  if (!existsSync(cliHtmlPath)) {
    errors.push(
      new FileSystemError(`The directory '${cliHtmlPath}' does not exist.`),
    )
    return errors
  }

  // Ensure the output directory exists
  execFile('mkdir', ['-p', outDir], (error) => {
    if (error) {
      errors.push(
        new FileSystemError(`Error creating output directory: ${error}`),
      )
      return
    }

    execFile(
      'cp',
      ['-R', `${cliHtmlPath}/.`, outDir],
      (error, _stdout, stderr) => {
        if (error) {
          errors.push(new FileSystemError(`Error copying files: ${stderr}`))
        }
      },
    )
  })

  return errors
}
