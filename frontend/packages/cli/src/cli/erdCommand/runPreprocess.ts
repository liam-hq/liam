import fs from 'node:fs'
import path from 'node:path'
import {
  type SupportedFormat,
  detectFormat,
  parse,
  supportedFormatSchema,
} from '@liam-hq/db-structure/parser'
import * as v from 'valibot'
import {
  ArgumentError,
  type CliError,
  FileSystemError,
  WarningProcessingError,
} from '../errors.js'
import { getInputContent } from './getInputContent.js'

type Output = {
  outputFilePath: string | null
  errors: CliError[]
}

export async function runPreprocess(
  inputPath: string,
  outputDir: string,
  format: SupportedFormat,
): Promise<Output> {
  const input = await getInputContent(inputPath)
  let detectedFormat: SupportedFormat | undefined

  if (format === undefined) {
    detectedFormat = detectFormat(inputPath)
  } else {
    detectedFormat = format
  }

  if (detectedFormat === undefined) {
    return {
      outputFilePath: null,
      errors: [
        new ArgumentError(
          '--format is missing, invalid, or specifies an unsupported format. Please provide a valid format.',
        ),
      ],
    }
  }

  const result = v.safeParse(supportedFormatSchema, detectedFormat)
  if (!result.success) {
    const errorMessage = result.issues.map((issue) => issue.message).join('\n')
    return {
      outputFilePath: null,
      errors: [
        new ArgumentError(
          `--format is missing, invalid, or specifies an unsupported format. Please provide a valid format.\n${errorMessage}`,
        ),
      ],
    }
  }

  const { value: json, errors } = await parse(input, detectedFormat)
  if (errors.length > 0) {
    return {
      outputFilePath: null,
      errors: errors.map(
        (err) =>
          new WarningProcessingError(
            `Error during parsing schema file: ${err.message}`,
          ),
      ),
    }
  }

  const filePath = path.join(outputDir, 'schema.json')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  try {
    const jsonContent = JSON.stringify(json, null, 2)
    fs.writeFileSync(filePath, jsonContent, 'utf8')
    return { outputFilePath: filePath, errors: [] }
  } catch (error) {
    return {
      outputFilePath: null,
      errors: [
        new FileSystemError(
          `Error during preprocessing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      ],
    }
  }
}
