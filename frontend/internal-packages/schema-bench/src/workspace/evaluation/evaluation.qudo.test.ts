import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { evaluateSchema } from '../evaluation'
import type { EvaluationConfig, Schema } from '../../types'

describe('Schema Evaluation', () => {
  const testWorkspacePath = path.join(__dirname, 'test-workspace')
  const outputDir = path.join(testWorkspacePath, 'execution', 'output')
  const referenceDir = path.join(testWorkspacePath, 'execution', 'reference')
  const evaluationDir = path.join(testWorkspacePath, 'evaluation')

  const mockSchema: Schema = {
    tables: {
      users: {
        columns: {
          id: { type: 'integer', nullable: false },
          name: { type: 'varchar', nullable: false }
        },
        primaryKey: ['id'],
        constraints: []
      }
    }
  }

  beforeEach(() => {
    // Clean up any existing test workspace
    if (fs.existsSync(testWorkspacePath)) {
      fs.rmSync(testWorkspacePath, { recursive: true, force: true })
    }
    
    // Create test directories
    fs.mkdirSync(outputDir, { recursive: true })
    fs.mkdirSync(referenceDir, { recursive: true })
  })

  afterEach(() => {
    // Clean up test workspace
    if (fs.existsSync(testWorkspacePath)) {
      fs.rmSync(testWorkspacePath, { recursive: true, force: true })
    }
  })

  it('testSuccessfulSchemaEvaluation', async () => {
    // Setup test data
    const caseId = 'test-case-1'
    fs.writeFileSync(
      path.join(outputDir, `${caseId}.json`),
      JSON.stringify(mockSchema, null, 2)
    )
    fs.writeFileSync(
      path.join(referenceDir, `${caseId}.json`),
      JSON.stringify(mockSchema, null, 2)
    )

    const config: EvaluationConfig = {
      workspacePath: testWorkspacePath,
      caseId,
      outputFormat: 'json'
    }

    const result = await evaluateSchema(config)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0].caseId).toBe(caseId)
      expect(result.value[0].metrics).toBeDefined()
      expect(typeof result.value[0].metrics.tableF1Score).toBe('number')
    }
  })

  it('testLoadMultipleSchemaFiles', async () => {
    // Setup multiple test files
    const caseIds = ['case1', 'case2', 'case3']
    
    for (const caseId of caseIds) {
      fs.writeFileSync(
        path.join(outputDir, `${caseId}.json`),
        JSON.stringify(mockSchema, null, 2)
      )
      fs.writeFileSync(
        path.join(referenceDir, `${caseId}.json`),
        JSON.stringify(mockSchema, null, 2)
      )
    }

    const config: EvaluationConfig = {
      workspacePath: testWorkspacePath,
      outputFormat: 'json'
    }

    const result = await evaluateSchema(config)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toHaveLength(3)
      expect(result.value.map(r => r.caseId).sort()).toEqual(caseIds.sort())
    }
  })

  it('testSaveEvaluationResults', async () => {
    // Setup test data
    const caseIds = ['case1', 'case2']
    
    for (const caseId of caseIds) {
      fs.writeFileSync(
        path.join(outputDir, `${caseId}.json`),
        JSON.stringify(mockSchema, null, 2)
      )
      fs.writeFileSync(
        path.join(referenceDir, `${caseId}.json`),
        JSON.stringify(mockSchema, null, 2)
      )
    }

    const config: EvaluationConfig = {
      workspacePath: testWorkspacePath,
      outputFormat: 'json'
    }

    const result = await evaluateSchema(config)

    expect(result.isOk()).toBe(true)
    
    // Check that evaluation directory was created
    expect(fs.existsSync(evaluationDir)).toBe(true)
    
    // Check that individual result files were created
    const evaluationFiles = fs.readdirSync(evaluationDir)
    const resultFiles = evaluationFiles.filter(f => f.includes('_results_'))
    expect(resultFiles).toHaveLength(2)
    
    // Check that summary file was created (for multiple cases)
    const summaryFiles = evaluationFiles.filter(f => f.includes('summary_results_'))
    expect(summaryFiles).toHaveLength(1)
  })

  it('testMissingDirectories', async () => {
    // Remove output directory
    fs.rmSync(outputDir, { recursive: true, force: true })

    const config: EvaluationConfig = {
      workspacePath: testWorkspacePath,
      outputFormat: 'json'
    }

    const result = await evaluateSchema(config)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('DIRECTORY_NOT_FOUND')
      expect(result.error.path).toBe(outputDir)
    }
  })

  it('testMalformedJsonFiles', async () => {
    // Create malformed JSON file
    const caseId = 'malformed-case'
    fs.writeFileSync(
      path.join(outputDir, `${caseId}.json`),
      '{ invalid json content'
    )
    fs.writeFileSync(
      path.join(referenceDir, `${caseId}.json`),
      JSON.stringify(mockSchema, null, 2)
    )

    const config: EvaluationConfig = {
      workspacePath: testWorkspacePath,
      caseId,
      outputFormat: 'json'
    }

    const result = await evaluateSchema(config)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('JSON_PARSE_ERROR')
      expect(result.error.path).toContain(`${caseId}.json`)
    }
  })

  it('testFilesystemPermissionErrors', async () => {
    // Setup test data first
    const caseId = 'permission-test'
    fs.writeFileSync(
      path.join(outputDir, `${caseId}.json`),
      JSON.stringify(mockSchema, null, 2)
    )
    fs.writeFileSync(
      path.join(referenceDir, `${caseId}.json`),
      JSON.stringify(mockSchema, null, 2)
    )

    // Create evaluation directory with restricted permissions
    fs.mkdirSync(evaluationDir, { recursive: true })
    fs.chmodSync(evaluationDir, 0o444) // Read-only permissions

    const config: EvaluationConfig = {
      workspacePath: testWorkspacePath,
      caseId,
      outputFormat: 'json'
    }

    const result = await evaluateSchema(config)

    // Restore permissions for cleanup
    fs.chmodSync(evaluationDir, 0o755)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('FILE_WRITE_ERROR')
    }
  })
})