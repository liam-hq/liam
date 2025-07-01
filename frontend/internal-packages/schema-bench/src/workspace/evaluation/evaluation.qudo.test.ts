import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { evaluateSchema } from '../evaluation/evaluation'
import type { EvaluationConfig, EvaluationResult } from '../types'
import type { Schema } from '@liam-hq/db-structure'

const TEST_WORKSPACE = path.join(__dirname, '__test_workspace__')
const OUTPUT_DIR = path.join(TEST_WORKSPACE, 'execution', 'output')
const REFERENCE_DIR = path.join(TEST_WORKSPACE, 'execution', 'reference')
const EVALUATION_DIR = path.join(TEST_WORKSPACE, 'evaluation')

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function cleanupDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function minimalSchema(name: string): Schema {
  return {
    tables: {
      [name]: {
        columns: { id: { type: 'int' } },
        primaryKey: ['id'],
        constraints: [],
        foreignKeys: [],
      },
    },
  }
}

describe('evaluateSchema integration', () => {
  beforeEach(() => {
    cleanupDir(TEST_WORKSPACE)
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    fs.mkdirSync(REFERENCE_DIR, { recursive: true })
  })

  afterEach(() => {
    cleanupDir(TEST_WORKSPACE)
  })

  it('test_evaluateSchema_multipleCases_success', async () => {
    // Prepare two cases
    const caseA = 'caseA'
    const caseB = 'caseB'
    writeJson(path.join(OUTPUT_DIR, `${caseA}.json`), minimalSchema('A'))
    writeJson(path.join(REFERENCE_DIR, `${caseA}.json`), minimalSchema('A'))
    writeJson(path.join(OUTPUT_DIR, `${caseB}.json`), minimalSchema('B'))
    writeJson(path.join(REFERENCE_DIR, `${caseB}.json`), minimalSchema('B'))

    const config: EvaluationConfig = {
      workspacePath: TEST_WORKSPACE,
      outputFormat: 'json',
    }

    const result = await evaluateSchema(config)
    expect(result.isOk()).toBe(true)
    const results = result.value
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(2)

    // Check individual result files
    const evalFiles = fs.readdirSync(EVALUATION_DIR)
    const individualFiles = evalFiles.filter(f => f.endsWith('.json') && f.includes('_results_'))
    expect(individualFiles.length).toBe(2)

    // Check summary file exists
    const summaryFiles = evalFiles.filter(f => f.startsWith('summary_results_'))
    expect(summaryFiles.length).toBe(1)
    const summaryContent = JSON.parse(fs.readFileSync(path.join(EVALUATION_DIR, summaryFiles[0]), 'utf-8'))
    expect(summaryContent.totalCases).toBe(2)
    expect(Array.isArray(summaryContent.cases)).toBe(true)
  })

  it('test_evaluateSchema_singleCase_success', async () => {
    const caseId = 'single'
    writeJson(path.join(OUTPUT_DIR, `${caseId}.json`), minimalSchema('S'))
    writeJson(path.join(REFERENCE_DIR, `${caseId}.json`), minimalSchema('S'))

    const config: EvaluationConfig = {
      workspacePath: TEST_WORKSPACE,
      caseId,
      outputFormat: 'json',
    }

    const result = await evaluateSchema(config)
    expect(result.isOk()).toBe(true)
    const results = result.value
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(1)
    expect(results[0].caseId).toBe(caseId)

    // Only one individual result file, no summary
    const evalFiles = fs.readdirSync(EVALUATION_DIR)
    const individualFiles = evalFiles.filter(f => f.endsWith('.json') && f.includes('_results_'))
    expect(individualFiles.length).toBe(1)
    const summaryFiles = evalFiles.filter(f => f.startsWith('summary_results_'))
    expect(summaryFiles.length).toBe(0)
  })

  it('test_saveResults_createsEvaluationDirIfMissing', async () => {
    // Remove evaluation dir if exists
    cleanupDir(EVALUATION_DIR)
    const caseId = 'dirtest'
    writeJson(path.join(OUTPUT_DIR, `${caseId}.json`), minimalSchema('D'))
    writeJson(path.join(REFERENCE_DIR, `${caseId}.json`), minimalSchema('D'))

    const config: EvaluationConfig = {
      workspacePath: TEST_WORKSPACE,
      outputFormat: 'json',
    }

    expect(fs.existsSync(EVALUATION_DIR)).toBe(false)
    const result = await evaluateSchema(config)
    expect(result.isOk()).toBe(true)
    expect(fs.existsSync(EVALUATION_DIR)).toBe(true)
    // Should have at least one result file
    const files = fs.readdirSync(EVALUATION_DIR)
    expect(files.length).toBeGreaterThan(0)
  })

  it('test_validateDirectories_missingDirectory_error', async () => {
    // Remove output dir
    cleanupDir(OUTPUT_DIR)
    const config: EvaluationConfig = {
      workspacePath: TEST_WORKSPACE,
      outputFormat: 'json',
    }
    const result = await evaluateSchema(config)
    expect(result.isErr()).toBe(true)
    expect(result.error.type).toBe('DIRECTORY_NOT_FOUND')
    expect(result.error.path).toContain('output')
  })

  it('test_readJsonFile_invalidJson_error', async () => {
    // Write invalid JSON to output
    const caseId = 'badjson'
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    fs.writeFileSync(path.join(OUTPUT_DIR, `${caseId}.json`), '{invalid json', 'utf-8')
    writeJson(path.join(REFERENCE_DIR, `${caseId}.json`), minimalSchema('B'))

    const config: EvaluationConfig = {
      workspacePath: TEST_WORKSPACE,
      outputFormat: 'json',
    }
    const result = await evaluateSchema(config)
    expect(result.isErr()).toBe(true)
    expect(result.error.type).toBe('JSON_PARSE_ERROR')
    expect(result.error.path).toContain(`${caseId}.json`)
  })

  it('test_validateAndPrepare_noCases_error', async () => {
    // Output and reference dirs exist but no matching files
    // (no files written)
    const config: EvaluationConfig = {
      workspacePath: TEST_WORKSPACE,
      outputFormat: 'json',
    }
    const result = await evaluateSchema(config)
    expect(result.isErr()).toBe(true)
    expect(result.error.type).toBe('VALIDATION_ERROR')
    expect(result.error.message).toContain('No cases to evaluate')
  })
})