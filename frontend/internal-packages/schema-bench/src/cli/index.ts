#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

const VERSION = '0.1.0'

// Resolve a TS CLI file under src/cli
const resolveCli = (file: string) => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  return path.resolve(__dirname, file)
}

const tsxPath = () => {
  // Use local tsx binary to run TypeScript files
  return require.resolve('tsx/dist/cli.js')
}

const runTsCli = (tsFile: string, args: string[]): Promise<number> => {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [tsxPath(), tsFile, ...args], {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd(),
    })
    child.on('exit', (code) => resolve(code ?? 0))
    child.on('error', () => resolve(1))
  })
}

const printHelp = () => {
  console.info(
    [
      `schema-bench ${VERSION}`,
      '',
      'Usage:',
      '  schema-bench execute --executor <liam|openai> [args...]',
      '  schema-bench evaluate [args...]',
      '  schema-bench compare',
      '',
      'Notes:',
      '  - All additional args after the subcommand are passed through',
      '    to the underlying script unchanged.',
    ].join('\n'),
  )
}

type Subcommand = 'execute' | 'evaluate' | 'compare' | 'help' | 'version'

const parseTopLevel = (): { sub: Subcommand; rest: string[] } => {
  const argv = process.argv.slice(2)
  const raw = argv[0] ?? 'help'
  const rest = argv.slice(1)
  if (raw === '-h' || raw === '--help') return { sub: 'help', rest }
  if (raw === '-v' || raw === '--version') return { sub: 'version', rest }
  if (raw === 'execute' || raw === 'evaluate' || raw === 'compare') {
    return { sub: raw, rest }
  }
  return { sub: 'help', rest }
}

const parseExecutor = (
  args: string[],
): { executor?: string; pass: string[] } => {
  let executor: string | undefined
  const pass: string[] = []
  let expectValue = false
  for (const tok of args) {
    if (expectValue) {
      if (!tok.startsWith('-')) {
        executor = tok
      } else {
        pass.push(tok)
      }
      expectValue = false
      continue
    }
    if (tok === '--executor' || tok === '-x') {
      expectValue = true
      continue
    }
    if (tok.startsWith('--executor=')) {
      executor = tok.slice('--executor='.length)
      continue
    }
    pass.push(tok)
  }
  if (executor === undefined) return { pass }
  return { executor, pass }
}

async function main() {
  const { sub, rest } = parseTopLevel()
  if (sub === 'help') {
    printHelp()
    return
  }
  if (sub === 'version') {
    console.info(VERSION)
    return
  }
  if (sub === 'execute') {
    const { executor, pass } = parseExecutor(rest)
    if (!executor) {
      console.error('Missing required option: --executor <liam|openai>')
      process.exit(1)
    }
    const map: Record<string, string> = {
      openai: resolveCli('./executeOpenai.ts'),
      liam: resolveCli('./executeLiamDbUnified.ts'),
    }
    const target = map[String(executor).toLowerCase()]
    if (!target) {
      console.error('Unknown executor. Use one of: liam | openai')
      process.exit(1)
    }
    const code = await runTsCli(target, pass)
    process.exit(code)
  }
  if (sub === 'evaluate') {
    const target = resolveCli('./evaluateSchemaMulti.ts')
    const code = await runTsCli(target, rest)
    process.exit(code)
  }
  if (sub === 'compare') {
    console.info(
      'schema-bench compare (MVP1) placeholder. Use "schema-bench execute" to run and "schema-bench evaluate" for metrics.',
    )
    process.exit(0)
  }
  printHelp()
}

main().catch(() => process.exit(1))
