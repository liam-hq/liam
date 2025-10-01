// TODO: Replace this bespoke tracer by migrating the OpenAI executor to
// @langchain/openai's ChatOpenAI, then remove this file entirely. We currently
// call the OpenAI SDK directly, hence this helper exists; switching to ChatOpenAI
// will provide first-class LangSmith tracing via environment variables only.
// Planned to address in the next PR.
import { randomUUID } from 'node:crypto'
import { Client } from 'langsmith'
import type { TraceContext } from './types'

type StartRunOptions = {
  name: string
  inputs: Record<string, unknown>
  tags?: string[]
  metadata?: Record<string, unknown>
  projectName?: string
  runType?: 'llm' | 'chain' | 'tool' | 'retriever' | 'prompt' | 'embedding'
  traceContext?: TraceContext
}

type RunHandle = { id: string } | null

const isTruthy = (v: unknown): boolean =>
  v === true || v === 'true' || v === '1'

function isTracingEnabled(): boolean {
  const hasKey = Boolean(process.env['LANGSMITH_API_KEY'])
  const explicit = isTruthy(process.env['SCHEMA_BENCH_TRACE'])
  const ls = isTruthy(process.env['LANGSMITH_TRACING'])
  const lc = isTruthy(process.env['LANGCHAIN_TRACING_V2'])
  return hasKey && (explicit || ls || lc)
}

export class SchemaBenchTracer {
  private client: Client | null
  private enabled: boolean
  private projectName: string

  constructor() {
    this.enabled = isTracingEnabled()
    this.client = this.enabled ? new Client() : null
    this.projectName =
      process.env['LANGSMITH_PROJECT'] ||
      process.env['LANGCHAIN_PROJECT'] ||
      'schema-bench'
  }

  async startRun(opts: StartRunOptions): Promise<RunHandle> {
    if (!this.enabled || !this.client) return null
    try {
      const nowIso = new Date().toISOString()
      const derivedThreadId =
        opts.traceContext?.threadId ||
        (opts.traceContext?.datasetName && opts.traceContext?.caseId
          ? [
              opts.traceContext.datasetName,
              opts.traceContext.caseId,
              opts.traceContext.runId,
            ]
              .filter(Boolean)
              .join(':')
          : undefined)

      const runId = randomUUID()
      await this.client.createRun({
        id: runId,
        name: opts.name,
        run_type: opts.runType ?? 'chain',
        inputs: opts.inputs,
        project_name: opts.projectName ?? this.projectName,
        start_time: nowIso,
      })

      // Human-friendly console hints
      /*
       * Why keep these logs (do not remove):
       * - Provide deterministic correlation to LangSmith via thread_id/runId.
       * - Server-side only; never shipped to browsers.
       * - No secrets or PII; only ids and optional search URL.
       * - Useful when tracing backend is delayed/misconfigured.
       * - Minimal overhead; can be toggled/demoted later if needed.
       */
      const orgId = process.env['LANGSMITH_ORGANIZATION_ID']
      const projectId = process.env['LANGSMITH_PROJECT_ID']
      const threadId = derivedThreadId
      console.info(
        `[schema-bench] LangSmith run created: runId=${runId}` +
          (threadId ? ` thread_id=${threadId}` : '') +
          ` project=${opts.projectName ?? this.projectName}`,
      )
      if (orgId && projectId) {
        const base = `https://smith.langchain.com/o/${orgId}/projects/p/${projectId}`
        console.info(`[schema-bench] LangSmith project: ${base}`)
      }

      return { id: runId }
    } catch {
      // Fail silently to avoid affecting benchmark flow
      return null
    }
  }

  async endRunSuccess(
    handle: RunHandle,
    outputs: Record<string, unknown>,
    extra?: { usage?: Record<string, unknown> },
  ): Promise<void> {
    if (!this.enabled || !this.client || !handle) return
    try {
      const payload: Record<string, unknown> = {
        end_time: new Date().toISOString(),
        outputs,
      }
      if (extra?.usage) {
        payload['metrics'] = extra.usage
      }
      await this.client.updateRun(handle.id, payload)
    } catch {
      // ignore
    }
  }

  async endRunError(handle: RunHandle, error: unknown): Promise<void> {
    if (!this.enabled || !this.client || !handle) return
    try {
      await this.client.updateRun(handle.id, {
        end_time: new Date().toISOString(),
        error: String(error instanceof Error ? error.message : error),
      })
    } catch {
      // ignore
    }
  }
}

export const getTracer = (): SchemaBenchTracer => new SchemaBenchTracer()
