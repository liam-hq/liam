import { cpSync, existsSync, mkdirSync } from 'node:fs'
import path, { dirname, resolve, relative } from 'node:path'
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
  const resolvedOutDir = resolve(outDir)

  // generate schema.json
  const { errors: preprocessErrors } = await runPreprocess(
    inputPath,
    resolvedOutDir,
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
    mkdirSync(resolvedOutDir, { recursive: true })
    // Copy files recursively
    cpSync(cliHtmlPath, resolvedOutDir, { recursive: true })
  } catch (error) {
    errors.push(new FileSystemError(`Error processing files: ${error}`))
  }

  if (errors.length === 0) {
    // For absolute paths, display the absolute path
    // For relative paths, display the relative path from the current directory
    let displayOutDir = resolvedOutDir
    if (!path.isAbsolute(outDir)) {
      displayOutDir = relative(process.cwd(), resolvedOutDir) || resolvedOutDir
    }
    console.info(`
ERD has been generated successfully in the \`${displayOutDir}/\` directory.
Note: You cannot open this file directly using \`file://\`.
Please serve the \`${displayOutDir}/\` directory with an HTTP server and access it via \`http://\`.
Example:
    ${blueBright(`$ npx http-server ${displayOutDir}/`)}
`)
  }
  return errors
}
