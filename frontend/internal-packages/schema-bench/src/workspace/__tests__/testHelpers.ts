import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import type { Schema } from '@liam-hq/db-structure'
import { expect } from 'vitest'
import type { EvaluationConfig } from '../types'

const mockSchema: Schema = {
  tables: {
    users: {
      name: 'users',
      comment: '',
      columns: {
        id: {
          name: 'id',
          type: 'integer',
          default: '',
          check: '',
          notNull: true,
          comment: '',
        },
        name: {
          name: 'name',
          type: 'varchar',
          default: '',
          check: '',
          notNull: false,
          comment: '',
        },
      },
      indexes: {},
      constraints: {},
    },
  },
}

export class TestWorkspace {
  private tempDir: string

  constructor() {
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-workspace-'))
    this.setupDirectories()
  }

  private setupDirectories() {
    const outputDir = path.join(this.tempDir, 'execution', 'output')
    const referenceDir = path.join(this.tempDir, 'execution', 'reference')
    const evaluationDir = path.join(this.tempDir, 'evaluation')

    fs.mkdirSync(outputDir, { recursive: true })
    fs.mkdirSync(referenceDir, { recursive: true })
    fs.mkdirSync(evaluationDir, { recursive: true })
  }

  createFiles(cases: string[], schema?: Schema) {
    const outputDir = path.join(this.tempDir, 'execution', 'output')
    const referenceDir = path.join(this.tempDir, 'execution', 'reference')

    for (const caseId of cases) {
      fs.writeFileSync(
        path.join(outputDir, `${caseId}.json`),
        JSON.stringify(schema || mockSchema),
      )
      fs.writeFileSync(
        path.join(referenceDir, `${caseId}.json`),
        JSON.stringify(schema || mockSchema),
      )
    }
  }

  createOutputFile(caseId: string, schema?: Schema) {
    const outputDir = path.join(this.tempDir, 'execution', 'output')
    fs.writeFileSync(
      path.join(outputDir, `${caseId}.json`),
      JSON.stringify(schema || mockSchema),
    )
  }

  createReferenceFile(caseId: string, schema?: Schema) {
    const referenceDir = path.join(this.tempDir, 'execution', 'reference')
    fs.writeFileSync(
      path.join(referenceDir, `${caseId}.json`),
      JSON.stringify(schema || mockSchema),
    )
  }

  createInvalidJsonFile(caseId: string, directory: 'output' | 'reference') {
    const dir = path.join(this.tempDir, 'execution', directory)
    fs.writeFileSync(path.join(dir, `${caseId}.json`), 'invalid json')
  }

  removeDirectory(dir: 'output' | 'reference') {
    const dirPath = path.join(this.tempDir, 'execution', dir)
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true })
    }
  }

  get config(): EvaluationConfig {
    return {
      workspacePath: this.tempDir,
      outputFormat: 'json',
    }
  }

  getConfigWithCaseId(caseId: string): EvaluationConfig {
    return {
      ...this.config,
      caseId,
    }
  }

  expectEvaluationSuccess(result: { isOk(): boolean; isErr(): boolean }) {
    expect(result.isOk()).toBe(true)
  }

  expectEvaluationError(
    result: { isOk(): boolean; isErr(): boolean; error?: { type: string } },
    errorType: string,
  ) {
    expect(result.isErr()).toBe(true)
    if (result.isErr() && result.error) {
      expect(result.error.type).toBe(errorType)
    }
  }

  expectSummaryFileCreated() {
    const evaluationDir = path.join(this.tempDir, 'evaluation')
    const files = fs.readdirSync(evaluationDir)
    const summaryFiles = files.filter((file) =>
      file.startsWith('summary_results_'),
    )
    expect(summaryFiles.length).toBe(1)
  }

  expectResultFileCreated(caseId: string): string | undefined {
    const evaluationDir = path.join(this.tempDir, 'evaluation')
    const files = fs.readdirSync(evaluationDir)
    const resultFiles = files.filter((file) =>
      file.includes(`${caseId}_results_`),
    )
    expect(resultFiles.length).toBe(1)
    return resultFiles[0]
  }

  getResultFileContent(fileName: string): { caseId: string; metrics: unknown } {
    const evaluationDir = path.join(this.tempDir, 'evaluation')
    const filePath = path.join(evaluationDir, fileName)
    const content = fs.readFileSync(filePath, 'utf-8')
    const parsed: { caseId?: string; metrics?: unknown } = JSON.parse(content)
    return {
      caseId: parsed.caseId || '',
      metrics: parsed.metrics || {},
    }
  }

  cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true })
    }
  }
}
