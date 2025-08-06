/* eslint-disable no-throw-error/no-throw-error */
import type { RunnableConfig } from '@langchain/core/runnables'
import {
  BaseCheckpointSaver,
  type ChannelVersions,
  type Checkpoint,
  type CheckpointListOptions,
  type CheckpointMetadata,
  type CheckpointTuple,
  type PendingWrite,
} from '@langchain/langgraph-checkpoint'
import type { SupabaseClientType } from '@liam-hq/db'
import type {
  CheckpointRow,
  CheckpointWriteRow,
  SupabaseCheckpointSaverOptions,
  SupabaseCheckpointSaverParams,
} from './types'

/**
 * LangGraph checkpointer that uses Supabase as the backing store.
 * Supports Row Level Security (RLS) for multi-tenant applications.
 *
 * @example
 * ```typescript
 * import { createClient } from '@liam-hq/db'
 * import { SupabaseCheckpointSaver } from './checkpoint/SupabaseCheckpointSaver'
 *
 * const checkpointer = new SupabaseCheckpointSaver({
 *   client: createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!),
 *   options: {
 *     organizationId: 'your-org-id',
 *     enableCleanup: true,
 *   },
 * })
 *
 * const graph = createReactAgent({
 *   tools: [someTool],
 *   llm: new ChatOpenAI({ model: 'gpt-4' }),
 *   checkpointSaver: checkpointer,
 * })
 * ```
 */
export class SupabaseCheckpointSaver extends BaseCheckpointSaver {
  private readonly client: SupabaseClientType
  private readonly options: SupabaseCheckpointSaverOptions

  constructor(params: SupabaseCheckpointSaverParams) {
    super(params.serde)

    if (!params.options.organizationId?.trim()) {
      throw new Error('organizationId is required')
    }

    this.client = params.client
    this.options = {
      enableCleanup: false,
      maxCheckpoints: 50,
      cleanupIntervalMs: 3600000, // 1 hour
      ...params.options,
    }
  }

  /**
   * Get a checkpoint tuple from the database.
   * Retrieves a checkpoint tuple based on the provided config.
   */
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const {
      thread_id,
      checkpoint_ns = '',
      checkpoint_id,
    } = config.configurable ?? {}

    if (!thread_id) {
      throw new Error('thread_id is required in config.configurable')
    }

    // Build query based on whether checkpoint_id is provided
    let query = this.client
      .from('session_checkpoints')
      .select(`
        id,
        organization_id,
        thread_id,
        checkpoint_ns,
        checkpoint_id,
        parent_checkpoint_id,
        checkpoint,
        metadata,
        created_at,
        updated_at
      `)
      .eq('thread_id', thread_id)
      .eq('checkpoint_ns', checkpoint_ns)

    if (checkpoint_id) {
      query = query.eq('checkpoint_id', checkpoint_id)
    } else {
      query = query.order('created_at', { ascending: false }).limit(1)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return undefined
    }

    const row = data

    // Load checkpoint with channel values and writes
    const checkpoint = await this._loadCheckpoint(row)
    const metadata = await this._loadMetadata(row.metadata)
    const pendingWrites = await this._loadWrites(
      thread_id,
      checkpoint_ns,
      row.checkpoint_id,
    )

    const finalConfig = {
      configurable: {
        thread_id,
        checkpoint_ns,
        checkpoint_id: row.checkpoint_id,
      },
    }

    const parentConfig = row.parent_checkpoint_id
      ? {
          configurable: {
            thread_id,
            checkpoint_ns,
            checkpoint_id: row.parent_checkpoint_id,
          },
        }
      : undefined

    return {
      config: finalConfig,
      checkpoint,
      metadata,
      parentConfig,
      pendingWrites,
    }
  }

  /**
   * List checkpoints from the database.
   * Retrieves checkpoints in descending order (newest first).
   */
  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions,
  ): AsyncGenerator<CheckpointTuple> {
    const { thread_id, checkpoint_ns = '' } = config.configurable ?? {}

    if (!thread_id) {
      throw new Error('thread_id is required in config.configurable')
    }

    const query = this._buildListQuery(thread_id, checkpoint_ns, options)
    const { data, error } = await query

    if (error || !data) {
      return
    }

    for (const row of data) {
      yield await this._buildCheckpointTuple(row, thread_id, checkpoint_ns)
    }
  }

  /**
   * Save a checkpoint to the database.
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: ChannelVersions,
  ): Promise<RunnableConfig> {
    const {
      thread_id,
      checkpoint_ns = '',
      checkpoint_id: parentCheckpointId,
    } = config.configurable ?? {}

    if (!thread_id) {
      throw new Error('thread_id is required in config.configurable')
    }

    const checkpointId = checkpoint.id
    const nextConfig = {
      configurable: {
        thread_id,
        checkpoint_ns,
        checkpoint_id: checkpointId,
      },
    }

    // Serialize checkpoint data
    const serializedCheckpoint = this._dumpCheckpoint(checkpoint)
    const serializedMetadata = await this._dumpMetadata(metadata)

    // Store the checkpoint
    const { data, error } = await this.client
      .from('session_checkpoints')
      .insert({
        organization_id: this.options.organizationId,
        thread_id,
        checkpoint_ns,
        checkpoint_id: checkpointId,
        parent_checkpoint_id: parentCheckpointId,
        checkpoint: serializedCheckpoint,
        metadata: serializedMetadata,
      })
      .select()

    if (error) {
      throw new Error(`Failed to save checkpoint: ${error.message}`)
    }

    // Store channel values as blobs if there are new versions
    await this._dumpBlobs(
      thread_id,
      checkpoint_ns,
      checkpoint.channel_values ?? {},
      newVersions,
    )

    return nextConfig
  }

  /**
   * Store intermediate writes linked to a checkpoint.
   */
  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    const {
      thread_id,
      checkpoint_ns = '',
      checkpoint_id,
    } = config.configurable ?? {}

    if (!thread_id || !checkpoint_id) {
      throw new Error(
        'thread_id and checkpoint_id are required in config.configurable',
      )
    }

    const writeRows = await this._dumpWrites(
      thread_id,
      checkpoint_ns,
      checkpoint_id,
      taskId,
      writes,
    )

    if (writeRows.length === 0) {
      return
    }

    const { error } = await this.client
      .from('session_checkpoint_writes')
      .insert(writeRows)

    if (error) {
      throw new Error(`Failed to save writes: ${error.message}`)
    }
  }

  // Private helper methods

  private _buildListQuery(
    threadId: string,
    checkpointNs: string,
    options?: CheckpointListOptions,
  ) {
    const { limit, filter, before } = options ?? {}

    let query = this.client
      .from('session_checkpoints')
      .select(`
        id,
        organization_id,
        thread_id,
        checkpoint_ns,
        checkpoint_id,
        parent_checkpoint_id,
        checkpoint,
        metadata,
        created_at,
        updated_at
      `)
      .eq('thread_id', threadId)
      .eq('checkpoint_ns', checkpointNs)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    // Add filter conditions if provided
    if (filter && Object.keys(filter).length > 0) {
      for (const [key, value] of Object.entries(filter)) {
        query = query.contains('metadata', { [key]: value })
      }
    }

    // Add before condition if provided
    if (before?.configurable?.checkpoint_id) {
      query = query.lt('checkpoint_id', before.configurable.checkpoint_id)
    }

    return query
  }

  private async _buildCheckpointTuple(
    row: CheckpointRow,
    threadId: string,
    checkpointNs: string,
  ): Promise<CheckpointTuple> {
    const checkpoint = await this._loadCheckpoint(row)
    const metadata = await this._loadMetadata(row.metadata)
    const pendingWrites = await this._loadWrites(
      threadId,
      checkpointNs,
      row.checkpoint_id,
    )

    const finalConfig = {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: row.checkpoint_id,
      },
    }

    const parentConfig = row.parent_checkpoint_id
      ? {
          configurable: {
            thread_id: threadId,
            checkpoint_ns: checkpointNs,
            checkpoint_id: row.parent_checkpoint_id,
          },
        }
      : undefined

    return {
      config: finalConfig,
      checkpoint,
      metadata,
      parentConfig,
      pendingWrites,
    }
  }

  private _isValidCheckpoint(
    data: unknown,
  ): data is Omit<Checkpoint, 'channel_values'> {
    if (!this._isValidRecord(data)) {
      return false
    }

    // Safe to access properties since we validated it's a record
    return (
      typeof data.id === 'string' &&
      typeof data.channel_versions === 'object' &&
      data.channel_versions !== null &&
      !Array.isArray(data.channel_versions)
    )
  }

  private _isValidRecord(data: unknown): data is Record<string, unknown> {
    return data != null && typeof data === 'object' && !Array.isArray(data)
  }

  private async _loadCheckpoint(row: CheckpointRow): Promise<Checkpoint> {
    const checkpointData = row.checkpoint
    if (!this._isValidCheckpoint(checkpointData)) {
      throw new Error('Invalid checkpoint data')
    }

    // TypeScript now knows checkpointData is the correct type after type guard
    const checkpoint = checkpointData

    // Load channel values from blobs
    const channelValues = await this._loadBlobs(
      row.thread_id,
      row.checkpoint_ns,
      checkpoint.channel_versions,
    )

    return {
      ...checkpoint,
      channel_values: channelValues,
    }
  }

  private async _loadBlobs(
    threadId: string,
    checkpointNs: string,
    channelVersions: Record<string, number>,
  ): Promise<Record<string, unknown>> {
    if (Object.keys(channelVersions).length === 0) {
      return {}
    }

    const conditions = Object.entries(channelVersions)
      .map(
        ([channel, version]) => `(channel.eq.${channel},version.eq.${version})`,
      )
      .join(',')

    const { data, error } = await this.client
      .from('session_checkpoint_blobs')
      .select('channel, type, blob')
      .eq('thread_id', threadId)
      .eq('checkpoint_ns', checkpointNs)
      .or(conditions)

    if (error || !data) {
      return {}
    }

    const channelValues: Record<string, unknown> = {}

    for (const blob of data) {
      if (blob.type !== 'empty' && blob.blob) {
        const blobData = Buffer.from(blob.blob, 'base64')
        const value = await this.serde.loadsTyped(blob.type, blobData)
        channelValues[blob.channel] = value
      }
    }

    return channelValues
  }

  private async _loadMetadata(metadata: unknown): Promise<CheckpointMetadata> {
    if (!this._isValidRecord(metadata)) {
      return {}
    }

    // Since we validated it's a plain object, it's safe to return as CheckpointMetadata
    // CheckpointMetadata is defined as a record of unknown values in LangGraph
    return metadata as CheckpointMetadata
  }

  private async _loadWrites(
    threadId: string,
    checkpointNs: string,
    checkpointId: string,
  ): Promise<PendingWrite[]> {
    const { data, error } = await this.client
      .from('session_checkpoint_writes')
      .select('task_id, channel, type, blob')
      .eq('thread_id', threadId)
      .eq('checkpoint_ns', checkpointNs)
      .eq('checkpoint_id', checkpointId)
      .order('task_id')
      .order('idx')

    if (error || !data) {
      return []
    }

    const writes: PendingWrite[] = []

    for (const write of data) {
      if (write.type && write.blob) {
        const blobData = Buffer.from(write.blob, 'base64')
        const value = await this.serde.loadsTyped(write.type, blobData)
        writes.push([write.channel, value])
      }
    }

    return writes
  }

  private _dumpCheckpoint(checkpoint: Checkpoint): Record<string, unknown> {
    const serialized = { ...checkpoint }
    if ('channel_values' in serialized) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete serialized.channel_values
    }
    return serialized
  }

  private async _dumpMetadata(
    metadata: CheckpointMetadata,
  ): Promise<Record<string, unknown>> {
    if (!this._isValidRecord(metadata)) {
      return {}
    }

    // CheckpointMetadata is already a record type, safe to return directly
    return metadata as Record<string, unknown>
  }

  private async _dumpBlobs(
    threadId: string,
    checkpointNs: string,
    channelValues: Record<string, unknown>,
    versions: ChannelVersions,
  ): Promise<void> {
    if (Object.keys(versions).length === 0) {
      return
    }

    const blobRows = []

    for (const [channel, version] of Object.entries(versions)) {
      const value = channelValues[channel]
      let type = 'empty'
      let blob: string | null = null

      if (value !== undefined) {
        const [serializedType, serializedValue] =
          await this.serde.dumpsTyped(value)
        type = serializedType
        blob = serializedValue ? Buffer.from(serializedValue).toString('base64') : null
      }

      blobRows.push({
        organization_id: this.options.organizationId,
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        channel,
        version: version.toString(),
        type,
        blob,
      })
    }

    if (blobRows.length > 0) {
      const { error } = await this.client
        .from('session_checkpoint_blobs')
        .upsert(blobRows, {
          onConflict: 'thread_id,checkpoint_ns,channel,version',
          ignoreDuplicates: false,
        })

      if (error) {
        throw new Error(`Failed to save blobs: ${error.message}`)
      }
    }
  }

  private async _dumpWrites(
    threadId: string,
    checkpointNs: string,
    checkpointId: string,
    taskId: string,
    writes: PendingWrite[],
  ): Promise<
    Array<Omit<CheckpointWriteRow, 'id' | 'created_at' | 'updated_at'>>
  > {
    const writeRows: Array<
      Omit<CheckpointWriteRow, 'id' | 'created_at' | 'updated_at'>
    > = []

    for (let idx = 0; idx < writes.length; idx++) {
      const write = writes[idx]
      if (!write || write.length < 2) {
        continue
      }
      const [channel, value] = write
      const [type, serializedValue] = await this.serde.dumpsTyped(value)

      writeRows.push({
        organization_id: this.options.organizationId,
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpointId,
        task_id: taskId,
        idx,
        channel,
        type,
        blob: Buffer.from(serializedValue).toString('base64'),
      })
    }

    return writeRows
  }

  /**
   * Delete all checkpoint data for a specific thread
   * @param threadId - The thread ID to delete data for
   */
  async deleteThread(threadId: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('threadId is required')
    }

    // Delete in order: writes -> blobs -> checkpoints (to respect foreign key constraints)
    const { error: writesError } = await this.client
      .from('session_checkpoint_writes')
      .delete()
      .eq('thread_id', threadId)

    if (writesError) {
      throw new Error(
        `Failed to delete checkpoint writes: ${writesError.message}`,
      )
    }

    const { error: blobsError } = await this.client
      .from('session_checkpoint_blobs')
      .delete()
      .eq('thread_id', threadId)

    if (blobsError) {
      throw new Error(
        `Failed to delete checkpoint blobs: ${blobsError.message}`,
      )
    }

    const { error: checkpointsError } = await this.client
      .from('session_checkpoints')
      .delete()
      .eq('thread_id', threadId)

    if (checkpointsError) {
      throw new Error(
        `Failed to delete checkpoints: ${checkpointsError.message}`,
      )
    }
  }
}
