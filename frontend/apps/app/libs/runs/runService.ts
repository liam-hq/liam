import type { SupabaseClientType } from '@liam-hq/db'

type StartRunParams = {
  supabase: SupabaseClientType
  designSessionId: string
  organizationId: string
  userId: string
  startedAt?: string
}

type AppendEventParams = {
  eventType: 'started' | 'completed' | 'error'
  eventAt?: string
}

export class RunTracker {
  private readonly supabase: SupabaseClientType
  private readonly runId: string
  private readonly organizationId: string

  private constructor(
    supabase: SupabaseClientType,
    runId: string,
    organizationId: string,
  ) {
    this.supabase = supabase
    this.runId = runId
    this.organizationId = organizationId
  }

  static resume({
    supabase,
    runId,
    organizationId,
  }: {
    supabase: SupabaseClientType
    runId: string
    organizationId: string
  }): RunTracker {
    return new RunTracker(supabase, runId, organizationId)
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
      .insert({
        design_session_id: designSessionId,
        organization_id: organizationId,
        created_by_user_id: userId,
        started_at: startedAt,
      })
      .select('id')
      .single()

    if (error || !data) {
      throw Object.assign(new Error('Failed to create run'), { cause: error })
    }

    const tracker = new RunTracker(supabase, data.id, organizationId)
    await tracker.appendEvent({ eventType: 'started', eventAt: startedAt })

    return tracker
  }

  get id(): string {
    return this.runId
  }

  async complete(eventAt?: string): Promise<void> {
    const timestamp = eventAt ?? new Date().toISOString()
    await this.appendEvent({
      eventType: 'completed',
      eventAt: timestamp,
    })
    const { error } = await this.supabase
      .from('runs')
      .update({ ended_at: timestamp })
      .eq('id', this.runId)
      .eq('organization_id', this.organizationId)
    if (error) {
      throw Object.assign(new Error('Failed to mark run as completed'), {
        cause: error,
      })
    }
  }

  async fail(eventAt?: string): Promise<void> {
    const timestamp = eventAt ?? new Date().toISOString()
    await this.appendEvent({
      eventType: 'error',
      eventAt: timestamp,
    })
    const { error } = await this.supabase
      .from('runs')
      .update({ ended_at: timestamp })
      .eq('id', this.runId)
      .eq('organization_id', this.organizationId)
    if (error) {
      throw Object.assign(new Error('Failed to mark run as errored'), {
        cause: error,
      })
    }
  }

  private async appendEvent({
    eventType,
    eventAt = new Date().toISOString(),
  }: AppendEventParams): Promise<void> {
    const { error } = await this.supabase.from('run_events').insert({
      run_id: this.runId,
      organization_id: this.organizationId,
      event_type: eventType,
      event_at: eventAt,
    })

    if (error) {
      throw Object.assign(new Error('Failed to append run event'), {
        cause: error,
      })
    }
  }
}
