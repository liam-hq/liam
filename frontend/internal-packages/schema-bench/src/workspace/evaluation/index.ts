import * as path from 'node:path'
import type { EvaluationConfig } from '../types'
import { evaluateSchema } from './evaluation.ts'

const main = async (): Promise<void> => {
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

main()
