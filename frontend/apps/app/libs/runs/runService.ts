import type { SupabaseClientType } from '@liam-hq/db'

type WorkflowRunStatus = 'running' | 'completed' | 'error'

type StartRunParams = {
  supabase: SupabaseClientType
  designSessionId: string
  userId: string
  startedAt?: string
}

type AppendEventParams = {
  status: WorkflowRunStatus
  eventAt?: string
  userId?: string
}

export class RunTracker {
  private readonly supabase: SupabaseClientType
  private readonly runId: string
  private readonly actorUserId?: string

  private constructor(
    supabase: SupabaseClientType,
    runId: string,
    actorUserId?: string,
  ) {
    this.supabase = supabase
    this.runId = runId
    this.actorUserId = actorUserId
  }

  static resume({
    supabase,
    runId,
    userId,
  }: {
    supabase: SupabaseClientType
    runId: string
    userId?: string
  }): RunTracker {
    return new RunTracker(supabase, runId, userId)
  }

  static async start({
    supabase,
    designSessionId,
    userId,
    startedAt = new Date().toISOString(),
  }: StartRunParams): Promise<RunTracker> {
    const { data, error } = await supabase
      .from('runs')
      .upsert(
        {
          design_session_id: designSessionId,
          created_by_user_id: userId,
          started_at: startedAt,
          ended_at: null,
        },
        {
          onConflict: 'design_session_id',
        },
      )
      .select('id')
      .single()

    if (error || !data) {
      throw Object.assign(new Error('Failed to create run'), { cause: error })
    }

    const { error: appendError } = await RunTracker.appendEventInternal(
      supabase,
      {
        status: 'running',
        eventAt: startedAt,
        userId,
      },
      data.id,
    )

    if (appendError) {
      throw Object.assign(new Error('Failed to record run start event'), {
        cause: appendError,
      })
    }

    return new RunTracker(supabase, data.id, userId)
  }

  get id(): string {
    return this.runId
  }

  async complete(eventAt?: string, userId?: string): Promise<void> {
    const { error } = await RunTracker.appendEventInternal(
      this.supabase,
      {
        status: 'completed',
        eventAt,
        userId: userId ?? this.actorUserId,
      },
      this.runId,
    )
    if (error) {
      throw Object.assign(new Error('Failed to mark run as completed'), {
        cause: error,
      })
    }
  }

  async fail(eventAt?: string, userId?: string): Promise<void> {
    const { error } = await RunTracker.appendEventInternal(
      this.supabase,
      {
        status: 'error',
        eventAt,
        userId: userId ?? this.actorUserId,
      },
      this.runId,
    )
    if (error) {
      throw Object.assign(new Error('Failed to mark run as errored'), {
        cause: error,
      })
    }
  }

  private static appendEventInternal(
    supabase: SupabaseClientType,
    { status, eventAt, userId }: AppendEventParams,
    runId: string,
  ) {
    const timestamp = eventAt ?? new Date().toISOString()
    return supabase.from('run_events').insert({
      run_id: runId,
      status,
      created_by_user_id: userId,
      created_at: timestamp,
    })
  }
}
