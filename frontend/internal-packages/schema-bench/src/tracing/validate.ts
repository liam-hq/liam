import { err, ok, type Result } from 'neverthrow'

const isTruthy = (v: unknown): boolean =>
  v === true || v === 'true' || v === '1'

function isLangSmithTracingEnabled(): boolean {
  const hasKey = Boolean(process.env['LANGSMITH_API_KEY'])
  const explicit = isTruthy(process.env['SCHEMA_BENCH_TRACE'])
  const ls = isTruthy(process.env['LANGSMITH_TRACING'])
  const lc = isTruthy(process.env['LANGCHAIN_TRACING_V2'])
  return hasKey && (explicit || ls || lc)
}

export function ensureLangSmithTracing(context?: string): Result<void, Error> {
  if (isLangSmithTracingEnabled()) return ok(undefined)
  const where = context ? ` for ${context}` : ''
  const msg = [
    `LangSmith tracing is required${where}.`,
    'Please set the following environment variables:',
    '  - LANGSMITH_API_KEY',
    '  - One of: LANGCHAIN_TRACING_V2=true, LANGSMITH_TRACING=true, or SCHEMA_BENCH_TRACE=1',
    'Optional:',
    '  - LANGSMITH_PROJECT=schema-bench',
    '  - LANGSMITH_ORGANIZATION_ID and LANGSMITH_PROJECT_ID (for UI search URLs)',
  ].join('\n')
  return err(new Error(msg))
}
