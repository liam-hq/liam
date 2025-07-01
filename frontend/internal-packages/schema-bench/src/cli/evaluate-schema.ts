import * as path from 'node:path'

import { evaluateSchema } from '../workspace/evaluation/evaluation.ts'
import type { EvaluationConfig, WorkspaceError } from '../workspace/types'

// Right now, the script processes process.argv directly and lives in this package since it's still rough and only meant for internal (Liam team) use.
// In the future, once things are more stable, we'd like to move this feature to the CLI package and rely on something like commander for argument parsing.

const formatError = (error: WorkspaceError): string => {
  switch (error.type) {
    case 'DIRECTORY_NOT_FOUND':
      return `Directory not found: ${error.path}`
    case 'FILE_READ_ERROR':
      return `Failed to read file at ${error.path}: ${error.cause}`
    case 'FILE_WRITE_ERROR':
      return `Failed to write file at ${error.path}: ${error.cause}`
    case 'JSON_PARSE_ERROR':
      return `Failed to parse JSON at ${error.path}: ${error.cause}`
    case 'SCHEMA_NOT_FOUND':
      return `${error.schemaType} schema not found for case: ${error.caseId}`
    case 'VALIDATION_ERROR':
      return `Validation error: ${error.message}`
    case 'EVALUATION_ERROR':
      return `Evaluation failed for case ${error.caseId}: ${error.cause}`
    default:
      return 'Unknown error occurred'
  }
}

const runEvaluateSchema = async (): Promise<void> => {
  const initCwd = process.env['INIT_CWD'] || process.cwd()
  const workspacePath = path.resolve(initCwd, 'benchmark-workspace')
  const args = process.argv.slice(2)

  let caseId: string | undefined
  const caseArg = args.find((arg) => arg.startsWith('--case='))
  if (caseArg) {
    caseId = caseArg.split('=')[1]
  }

  const casesArg = args.find((arg) => arg.startsWith('--cases='))
  if (casesArg && !caseId) {
    const cases = casesArg.split('=')[1]?.split(',')
    if (cases?.length === 1) {
      caseId = cases[0]
    }
  }

  const config: EvaluationConfig = {
    workspacePath,
    ...(caseId && { caseId }),
    outputFormat: 'json',
  }

  const result = await evaluateSchema(config)

  if (result.isErr()) {
    console.error('❌ Schema evaluation failed:', formatError(result.error))
    process.exit(1)
  }
}

runEvaluateSchema()
