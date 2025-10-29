import type { SupabaseClientType } from '@liam-hq/db'

type WorkflowRunStatus = 'running' | 'completed' | 'error'

type StartRunParams = {
  supabase: SupabaseClientType
  designSessionId: string
  organizationId: string
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
  private readonly organizationId: string
  private readonly actorUserId?: string

  private constructor(
    supabase: SupabaseClientType,
    runId: string,
    organizationId: string,
    actorUserId?: string,
  ) {
    this.supabase = supabase
    this.runId = runId
    this.organizationId = organizationId
    this.actorUserId = actorUserId
  }

  static resume({
    supabase,
    runId,
    organizationId,
    userId,
  }: {
    supabase: SupabaseClientType
    runId: string
    organizationId: string
    userId?: string
  }): RunTracker {
    return new RunTracker(supabase, runId, organizationId, userId)
  }

  static async start({
    supabase,
    designSessionId,
    organizationId,
    userId,
    startedAt = new Date().toISOString(),
  }: StartRunParams): Promise<RunTracker> {
    const { data, error } = await supabase
      .from('runs')
      .upsert(
        {
          design_session_id: designSessionId,
          organization_id: organizationId,
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
      organizationId,
    )

    if (appendError) {
      throw Object.assign(new Error('Failed to record run start event'), {
        cause: appendError,
      })
    }

    return new RunTracker(supabase, data.id, organizationId, userId)
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
      this.organizationId,
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
      this.organizationId,
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
    organizationId: string,
  ) {
    const timestamp = eventAt ?? new Date().toISOString()
    return supabase.from('run_events').insert({
      run_id: runId,
      organization_id: organizationId,
      status,
      created_by_user_id: userId,
      created_at: timestamp,
    })
  }
}
