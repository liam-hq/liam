import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { expect } from 'vitest'
import type { WorkspaceConfig } from '../types'

export class SetupTestWorkspace {
  tempDir: string
  defaultDataDir: string

  constructor() {
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-workspace-'))
    this.defaultDataDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'test-default-'),
    )
  }

  createDefaultDataStructure() {
    const inputDir = path.join(this.defaultDataDir, 'execution', 'input')
    const referenceDir = path.join(
      this.defaultDataDir,
      'execution',
      'reference',
    )
    fs.mkdirSync(inputDir, { recursive: true })
    fs.mkdirSync(referenceDir, { recursive: true })

    fs.writeFileSync(path.join(inputDir, 'test.json'), '{"test": "data"}')
    fs.writeFileSync(
      path.join(referenceDir, 'test.json'),
      '{"reference": "data"}',
    )
  }

  createExistingWorkspace(): string {
    const workspacePath = path.join(this.tempDir, 'workspace')
    fs.mkdirSync(workspacePath)
    fs.writeFileSync(
      path.join(workspacePath, 'existing.txt'),
      'existing content',
    )
    return workspacePath
  }

  getConfig(workspacePath?: string): WorkspaceConfig {
    return {
      workspacePath: workspacePath || path.join(this.tempDir, 'workspace'),
      defaultDataPath: this.defaultDataDir,
    }
  }

  getEmptyDefaultDataConfig(): WorkspaceConfig {
    const emptyDefaultDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'test-empty-'),
    )
    return {
      workspacePath: path.join(this.tempDir, 'workspace'),
      defaultDataPath: emptyDefaultDir,
    }
  }

  expectWorkspaceStructure(workspacePath: string) {
    expect(fs.existsSync(workspacePath)).toBe(true)
    expect(fs.existsSync(path.join(workspacePath, 'execution'))).toBe(true)
    expect(fs.existsSync(path.join(workspacePath, 'execution', 'input'))).toBe(
      true,
    )
    expect(
      fs.existsSync(path.join(workspacePath, 'execution', 'reference')),
    ).toBe(true)
    expect(fs.existsSync(path.join(workspacePath, 'execution', 'output'))).toBe(
      true,
    )
    expect(fs.existsSync(path.join(workspacePath, 'evaluation'))).toBe(true)
  }

  expectFilesCopied(workspacePath: string) {
    const inputFile = path.join(
      workspacePath,
      'execution',
      'input',
      'test.json',
    )
    const referenceFile = path.join(
      workspacePath,
      'execution',
      'reference',
      'test.json',
    )

    expect(fs.existsSync(inputFile)).toBe(true)
    expect(fs.existsSync(referenceFile)).toBe(true)

    const inputContent = fs.readFileSync(inputFile, 'utf-8')
    const referenceContent = fs.readFileSync(referenceFile, 'utf-8')

    expect(inputContent).toBe('{"test": "data"}')
    expect(referenceContent).toBe('{"reference": "data"}')
  }

  cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true })
    }
    if (fs.existsSync(this.defaultDataDir)) {
      fs.rmSync(this.defaultDataDir, { recursive: true, force: true })
    }
  }
}
