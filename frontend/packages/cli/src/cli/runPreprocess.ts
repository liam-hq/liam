import fs, { readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from '@liam-hq/db-structure/parser'

export function runPreprocess(inputPath: string, outputDir: string) {
  if (!fs.existsSync(inputPath)) {
    throw new Error('Invalid input path. Please provide a valid file.')
  }

  const input = readFileSync(inputPath, 'utf8')

  // TODO: Expand support to additional formats, e.g., 'postgres'
  const format = 'schemarb'
  const json = parse(input, format)

  const filePath = path.join(outputDir, 'schema.json')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  try {
    const jsonContent = JSON.stringify(json, null, 2)
    fs.writeFileSync(filePath, jsonContent, 'utf8')
    return filePath
  } catch (error) {
    console.error(
      `Error during preprocessing: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return null
  }
}
