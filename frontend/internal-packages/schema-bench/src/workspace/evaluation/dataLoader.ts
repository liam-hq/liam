import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Schema } from '@liam-hq/db-structure'
import { err, ok } from 'neverthrow'
import type { WorkspaceResult } from '../types'

export const loadOutputData = (
  workspacePath: string,
): WorkspaceResult<Map<string, Schema>> => {
  const outputDir = path.join(workspacePath, 'execution', 'output')
  const outputData = new Map<string, Schema>()

  if (!fs.existsSync(outputDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: outputDir })
  }

  try {
    const files = fs
      .readdirSync(outputDir)
      .filter((file) => file.endsWith('.json'))

    for (const file of files) {
      const caseId = path.basename(file, '.json')
      const filePath = path.join(outputDir, file)

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const schema = JSON.parse(content) as Schema
        outputData.set(caseId, schema)
      } catch (error) {
        return err({
          type: 'JSON_PARSE_ERROR',
          path: filePath,
          cause: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return ok(outputData)
  } catch (error) {
    return err({
      type: 'FILE_READ_ERROR',
      path: outputDir,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export const loadReferenceData = (
  workspacePath: string,
): WorkspaceResult<Map<string, Schema>> => {
  const referenceDir = path.join(workspacePath, 'execution', 'reference')
  const referenceData = new Map<string, Schema>()

  if (!fs.existsSync(referenceDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: referenceDir })
  }

  try {
    const files = fs
      .readdirSync(referenceDir)
      .filter((file) => file.endsWith('.json'))

    for (const file of files) {
      const caseId = path.basename(file, '.json')
      const filePath = path.join(referenceDir, file)

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const schema = JSON.parse(content) as Schema
        referenceData.set(caseId, schema)
      } catch (error) {
        return err({
          type: 'JSON_PARSE_ERROR',
          path: filePath,
          cause: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return ok(referenceData)
  } catch (error) {
    return err({
      type: 'FILE_READ_ERROR',
      path: referenceDir,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
