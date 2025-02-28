import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SupportedFormat } from '@liam-hq/db-structure/parser'
import { blueBright } from 'yoctocolors'
import { type CliError, FileSystemError } from '../../errors.js'
import { runPreprocess } from '../runPreprocess.js'

export const buildCommand = async (
  inputPath: string,
  outDir: string,
  format?: SupportedFormat,
): Promise<CliError[]> => {
  // generate schema.json
  const { errors: preprocessErrors } = await runPreprocess(
    inputPath,
    outDir,
    format,
  )
  if (preprocessErrors.length > 0) {
    // In the future, we want to allow dist to be generated and the process to complete successfully with a warning message, even if there are minor errors.
    // see also: actionRunner.ts
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

  try {
    // Ensure the output directory exists
    mkdirSync(outDir, { recursive: true })
    // Copy files recursively
    cpSync(cliHtmlPath, outDir, { recursive: true })
  } catch (error) {
    errors.push(new FileSystemError(`Error processing files: ${error}`))
  }

  if (errors.length === 0) {
    console.info(`
ERD has been generated successfully in the \`dist/\` directory.
Note: You cannot open this file directly using \`file://\`.
Please serve the \`dist/\` directory with an HTTP server and access it via \`http://\`.
Example:
    ${blueBright('$ npx http-server dist/')}
`)
  }
  return errors
}
