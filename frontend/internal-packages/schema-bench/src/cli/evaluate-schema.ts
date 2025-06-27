import * as path from 'node:path'
import { evaluateSchema } from '../workspace/evaluation/evaluation.ts'
import type { EvaluationConfig } from '../workspace/types'
// Right now, the script processes process.argv directly and lives in this package since it’s still rough and only meant for internal (Liam team) use.
// In the future, once things are more stable, we’d like to move this feature to the CLI package and rely on something like commander for argument parsing.
const runEvaluateSchema = async (): Promise<void> => {
  const initCwd = process.env.INIT_CWD || process.cwd()
  const workspacePath = path.resolve(initCwd, 'benchmark-workspace')
  const args = process.argv.slice(2)

  let caseId: string | undefined
  const caseArg = args.find((arg) => arg.startsWith('--case='))
  if (caseArg) {
    caseId = caseArg.split('=')[1]
  }

  const casesArg = args.find((arg) => arg.startsWith('--cases='))
  if (casesArg && !caseId) {
    const cases = casesArg.split('=')[1].split(',')
    if (cases.length === 1) {
      caseId = cases[0]
    }
  }

  const config: EvaluationConfig = {
    workspacePath,
    caseId,
    outputFormat: 'json',
  }

  try {
    await evaluateSchema(config)
  } catch (error) {
    console.error('❌ Schema evaluation failed:', error)
    process.exit(1)
  }
}

runEvaluateSchema()
