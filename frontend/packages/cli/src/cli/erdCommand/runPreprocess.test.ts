import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { SupportedFormat } from '@liam-hq/db-structure/parser'
import { describe, expect, it } from 'vitest'
import { ArgumentError, WarningProcessingError } from '../errors.js'
import { runPreprocess } from './runPreprocess.js'

describe('runPreprocess', () => {
  const testCases = [
    {
      format: 'postgres',
      inputFilename: 'input.sql',
      content: 'CREATE TABLE test (id INT, name VARCHAR(255));',
    },
    {
      format: 'schemarb',
      inputFilename: 'input.schema.rb',
      content: `
        create_table "test" do |t|
          t.integer "id"
          t.string "name", limit: 255
        end
      `,
    },
  ] as const

  it.each(testCases)(
    'should create schema.json with the content in $format format',
    async ({ format, inputFilename, content }) => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-distDir-'))
      const inputPath = path.join(tmpDir, inputFilename)

      fs.writeFileSync(inputPath, content, 'utf8')

      const { outputFilePath, errors } = await runPreprocess(
        inputPath,
        tmpDir,
        format,
      )
      if (!outputFilePath) throw new Error('Failed to run preprocess')

      expect(errors).toEqual([])
      expect(fs.existsSync(outputFilePath)).toBe(true)

      // Validate output file content
      const outputContent = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'))
      expect(outputContent.tables).toBeDefined()
    },
  )

  it('should return an error if the format is invalid', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-distDir-'))
    const inputPath = path.join(tmpDir, 'input.sql')
    fs.writeFileSync(
      inputPath,
      'CREATE TABLE test (id INT, name VARCHAR(255));',
      'utf8',
    )

    const { outputFilePath, errors } = await runPreprocess(
      inputPath,
      tmpDir,
      'invalid' as SupportedFormat,
    )
    expect(outputFilePath).toBeNull()
    expect(errors).toEqual([
      new ArgumentError(
        '--format is missing, invalid, or specifies an unsupported format. Please provide a valid format (e.g., "schemarb" or "postgres").',
      ),
    ])
  })

  it('should return an error if failed parcing schema file', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-distDir-'))
    const inputPath = path.join(tmpDir, 'input.sql')
    fs.writeFileSync(inputPath, 'invalid;', 'utf8')

    const { outputFilePath, errors } = await runPreprocess(
      inputPath,
      tmpDir,
      'postgres',
    )
    expect(outputFilePath).toBeNull()
    expect(errors).toEqual([
      new WarningProcessingError(
        'Error during parcing schema file: syntax error at or near "invalid"',
      ),
    ])
  })
})
