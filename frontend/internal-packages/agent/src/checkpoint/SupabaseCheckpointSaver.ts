import type { RunnableConfig } from '@langchain/core/runnables'
import {
  BaseCheckpointSaver,
  type ChannelVersions,
  type Checkpoint,
  type CheckpointListOptions,
  type CheckpointMetadata,
  type CheckpointTuple,
  type PendingWrite,
  WRITES_IDX_MAP,
} from '@langchain/langgraph-checkpoint'
import type { Database, Json, SupabaseClientType } from '@liam-hq/db'
import {
  base64ToUint8Array,
  hexToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToString,
} from './byteaUtils'
import { parseCheckpointMetadata, parseSerializedCheckpoint } from './schemas'
import type { SerializedCheckpoint } from './types'

/**
 * Configuration options for SupabaseCheckpointSaver
 */
type SupabaseCheckpointSaverOptions = {
  /**
   * Organization ID for data isolation
   */
  organizationId: string
}

/**
 * Configuration for SupabaseCheckpointSaver constructor
 */
type SupabaseCheckpointSaverConfig = {
  client: SupabaseClientType
  options: SupabaseCheckpointSaverOptions
}

/**
 * Supabase implementation of LangGraph BaseCheckpointSaver
 *
 * Provides persistent checkpoint storage for LangGraph workflows using Supabase.
 * All data is isolated at the organization level for multi-tenancy support.
 *
 * ## Serialization Strategy
 *
 * This implementation uses the default BaseCheckpointSaver serializer, which:
 * - Serializes data as JSON format with type information
 * - Is optimized for PostgreSQL direct connections
 * - Handles standard JavaScript types (objects, arrays, primitives)
 *
 * ## BYTEA Column Handling in Supabase
 *
 * When working with BYTEA columns through Supabase REST API:
 * 1. **Writing**: Data should be Base64 encoded before sending
 * 2. **Reading**: Supabase returns BYTEA as PostgreSQL hex format (e.g., '\x6465...')
 * 3. **Conversion flow**:
 *    - Write: JSON → serialize → Base64 → BYTEA (stored as hex internally)
 *    - Read: BYTEA (hex) → decode hex → Base64 → deserialize → JSON
 *
 * Note: The default serializer handles JSON serialization, but Base64 encoding
 * for BYTEA columns must be handled separately when interacting with Supabase.
 */

export class SupabaseCheckpointSaver extends BaseCheckpointSaver<number> {
  private readonly client: SupabaseClientType
  private readonly organizationId: string

  constructor(config: SupabaseCheckpointSaverConfig) {
    super()

    this.client = config.client
    this.organizationId = config.options.organizationId
  }

  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const {
      thread_id,
      checkpoint_ns = '',
      checkpoint_id,
    } = config.configurable ?? {}

    if (!thread_id) {
      return undefined
    }

    const baseQuery = this.client
      .from('checkpoints')
      .select('*')
      .eq('thread_id', thread_id)
      .eq('checkpoint_ns', checkpoint_ns)

    const query = checkpoint_id
      ? baseQuery.eq('checkpoint_id', checkpoint_id).single()
      : baseQuery.order('checkpoint_id', { ascending: false }).limit(1).single()

    const { data: checkpointData, error } = await query

    if (error || !checkpointData) {
      return undefined
    }

    // Fetch checkpoint blobs separately
    const { data: blobsData } = await this.client
      .from('checkpoint_blobs')
      .select('*')
      .eq('thread_id', thread_id)
      .eq('checkpoint_ns', checkpoint_ns)
      .eq('organization_id', this.organizationId)

    // Fetch checkpoint writes separately
    const { data: writesData } = await this.client
      .from('checkpoint_writes')
      .select('*')
      .eq('thread_id', thread_id)
      .eq('checkpoint_ns', checkpoint_ns)
      .eq('checkpoint_id', checkpointData.checkpoint_id)
      .eq('organization_id', this.organizationId)

    const checkpoint = await this._loadCheckpoint(
      checkpointData,
      blobsData || [],
    )

    const metadata = await this._loadMetadata(checkpointData.metadata)

    const finalConfig: RunnableConfig = {
      configurable: {
        thread_id,
        checkpoint_ns,
        checkpoint_id: checkpointData.checkpoint_id,
      },
    }

    const parentConfig = checkpointData.parent_checkpoint_id
      ? {
          configurable: {
            thread_id,
            checkpoint_ns,
            checkpoint_id: checkpointData.parent_checkpoint_id,
          },
        }
      : undefined

    const pendingWrites = await this._loadWrites(writesData || [])

    const tuple: CheckpointTuple = {
      config: finalConfig,
      checkpoint,
      metadata,
      pendingWrites,
    }

    if (parentConfig) {
      tuple.parentConfig = parentConfig
    }

    return tuple
  }

  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions,
  ): AsyncGenerator<CheckpointTuple> {
    const { filter, before, limit } = options ?? {}
    const { thread_id, checkpoint_ns = '' } = config.configurable ?? {}

    if (!thread_id) {
      return
    }

    let query = this.client
      .from('checkpoints')
      .select('*')
      .eq('thread_id', thread_id)
      .eq('checkpoint_ns', checkpoint_ns)
      .eq('organization_id', this.organizationId)

    // Apply filter
    if (filter && Object.keys(filter).length > 0) {
      // Metadata filter using JSONB containment
      query = query.contains('metadata', filter)
    }

    // Apply before cursor
    if (before?.configurable?.['checkpoint_id']) {
      query = query.lt('checkpoint_id', before.configurable['checkpoint_id'])
    }

    // Order and limit
    query = query.order('checkpoint_id', { ascending: false })
    if (limit) {
      query = query.limit(Number.parseInt(limit.toString(), 10))
    }

    const { data, error } = await query

    if (error || !data) {
      return
    }

    // Yield checkpoint tuples
    for (const row of data) {
      // Fetch checkpoint blobs separately for each row
      const { data: blobsData } = await this.client
        .from('checkpoint_blobs')
        .select('*')
        .eq('thread_id', row.thread_id)
        .eq('checkpoint_ns', row.checkpoint_ns)
        .eq('organization_id', this.organizationId)

      // Fetch checkpoint writes separately for each row
      const { data: writesData } = await this.client
        .from('checkpoint_writes')
        .select('*')
        .eq('thread_id', row.thread_id)
        .eq('checkpoint_ns', row.checkpoint_ns)
        .eq('checkpoint_id', row.checkpoint_id)
        .eq('organization_id', this.organizationId)

      const checkpoint = await this._loadCheckpoint(row, blobsData || [])

      const metadata = await this._loadMetadata(row.metadata)

      const parentConfig = row.parent_checkpoint_id
        ? {
            configurable: {
              thread_id: row.thread_id,
              checkpoint_ns: row.checkpoint_ns,
              checkpoint_id: row.parent_checkpoint_id,
            },
          }
        : undefined

      const tuple: CheckpointTuple = {
        config: {
          configurable: {
            thread_id: row.thread_id,
            checkpoint_ns: row.checkpoint_ns,
            checkpoint_id: row.checkpoint_id,
          },
        },
        checkpoint,
        metadata,
        pendingWrites: await this._loadWrites(writesData || []),
      }

      if (parentConfig) {
        tuple.parentConfig = parentConfig
      }

      yield tuple
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: ChannelVersions,
  ): Promise<RunnableConfig> {
    if (!config.configurable) {
      // BaseCheckpointSaver expects exceptions to be thrown
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error('Missing "configurable" field in "config" param')
    }

    const { thread_id, checkpoint_ns = '', checkpoint_id } = config.configurable

    const nextConfig: RunnableConfig = {
      configurable: {
        thread_id,
        checkpoint_ns,
        checkpoint_id: checkpoint.id,
      },
    }

    // Serialize checkpoint
    const serializedCheckpoint = this._dumpCheckpoint(checkpoint)
    const serializedMetadata = await this._dumpMetadata(metadata)

    // Insert checkpoint
    // NOTE: These tables must exist in Supabase database
    const checkpointInsert: Database['public']['Tables']['checkpoints']['Insert'] =
      {
        thread_id,
        checkpoint_ns,
        checkpoint_id: checkpoint.id,
        parent_checkpoint_id: checkpoint_id || null,
        checkpoint: JSON.parse(JSON.stringify(serializedCheckpoint)),
        metadata: JSON.parse(JSON.stringify(serializedMetadata)),
        organization_id: this.organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

    const { error: checkpointError } = await this.client
      .from('checkpoints')
      .upsert(checkpointInsert, {
        onConflict: 'thread_id,checkpoint_ns,checkpoint_id,organization_id',
      })

    if (checkpointError) {
      // BaseCheckpointSaver expects exceptions to be thrown
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(`Failed to save checkpoint: ${checkpointError.message}`)
    }

    const blobs = await this._dumpBlobs(
      thread_id,
      checkpoint_ns,
      checkpoint.channel_values,
      newVersions,
    )

    if (blobs.length > 0) {
      const { error: blobError } = await this.client
        .from('checkpoint_blobs')
        .upsert(blobs, {
          onConflict: 'thread_id,checkpoint_ns,channel,version,organization_id',
        })

      if (blobError) {
        // BaseCheckpointSaver expects exceptions to be thrown
        // eslint-disable-next-line no-throw-error/no-throw-error
        throw new Error(`Failed to save checkpoint blobs: ${blobError.message}`)
      }
    }

    return nextConfig
  }

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
      // BaseCheckpointSaver expects exceptions to be thrown
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error('Missing thread_id or checkpoint_id in config')
    }

    const dumpedWrites = await this._dumpWrites(
      thread_id,
      checkpoint_ns,
      checkpoint_id,
      taskId,
      writes,
    )

    if (dumpedWrites.length > 0) {
      const { error } = await this.client
        .from('checkpoint_writes')
        .upsert(dumpedWrites, {
          onConflict:
            'thread_id,checkpoint_ns,checkpoint_id,task_id,idx,organization_id',
        })

      if (error) {
        // BaseCheckpointSaver expects exceptions to be thrown
        // eslint-disable-next-line no-throw-error/no-throw-error
        throw new Error(`Failed to save checkpoint writes: ${error.message}`)
      }
    }
  }

  override getNextVersion(current: number | undefined): number {
    return (current ?? 0) + 1
  }

  /**
   * Delete all checkpoints and writes for a thread
   * Required for compatibility with LangGraph 0.4.x
   */
  async deleteThread(threadId: string): Promise<void> {
    const { error: checkpointsError } = await this.client
      .from('checkpoints')
      .delete()
      .eq('thread_id', threadId)
      .eq('organization_id', this.organizationId)

    if (checkpointsError) {
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(
        `Failed to delete checkpoints for thread ${threadId}: ${checkpointsError.message}`,
      )
    }

    const { error: writesError } = await this.client
      .from('checkpoint_writes')
      .delete()
      .eq('thread_id', threadId)
      .eq('organization_id', this.organizationId)

    if (writesError) {
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(
        `Failed to delete checkpoint writes for thread ${threadId}: ${writesError.message}`,
      )
    }

    const { error: blobsError } = await this.client
      .from('checkpoint_blobs')
      .delete()
      .eq('thread_id', threadId)
      .eq('organization_id', this.organizationId)

    if (blobsError) {
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(
        `Failed to delete checkpoint blobs for thread ${threadId}: ${blobsError.message}`,
      )
    }
  }

  /**
   * Helper method to load checkpoint from database row
   */
  private async _loadCheckpoint(
    row: Database['public']['Tables']['checkpoints']['Row'],
    blobs: Database['public']['Tables']['checkpoint_blobs']['Row'][],
  ): Promise<Checkpoint> {
    const checkpointData = parseSerializedCheckpoint(row.checkpoint)
    const channelValues = await this._loadBlobs(blobs)
    const channelVersions = this._convertVersionsToNumbers(
      checkpointData.channel_versions,
    )
    const versionsSeen = this._convertVersionsSeenToNumbers(
      checkpointData.versions_seen,
    )

    return {
      v: checkpointData.v || 1,
      id: checkpointData.id,
      ts: checkpointData.ts,
      channel_values: channelValues,
      channel_versions: channelVersions,
      versions_seen: versionsSeen,
    }
  }

  /**
   * Convert channel versions to numbers
   */
  private _convertVersionsToNumbers(
    versions?: Record<string, number | string>,
  ): Record<string, number> {
    const result: Record<string, number> = {}
    if (!versions) return result

    for (const [key, value] of Object.entries(versions)) {
      result[key] =
        typeof value === 'string' ? Number.parseInt(value, 10) : value
    }
    return result
  }

  /**
   * Convert versions seen to numbers
   */
  private _convertVersionsSeenToNumbers(
    versionsSeen?: Record<string, Record<string, number | string>>,
  ): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {}
    if (!versionsSeen) return result

    for (const [agent, versions] of Object.entries(versionsSeen)) {
      result[agent] = {}
      if (versions && typeof versions === 'object') {
        for (const [key, value] of Object.entries(versions)) {
          result[agent][key] =
            typeof value === 'string' ? Number.parseInt(value, 10) : value
        }
      }
    }
    return result
  }

  /**
   * Helper method to load channel values from blobs
   *
   * Supabase REST API specific implementation:
   * - Receives structured row objects with BYTEA data as hex-encoded strings
   * - Handles double encoding: hex -> base64 -> actual data
   * - Always expects string type for blob data (never Uint8Array)
   */
  private async _loadBlobs(
    blobs: Database['public']['Tables']['checkpoint_blobs']['Row'][],
  ): Promise<Record<string, unknown>> {
    if (!blobs || blobs.length === 0) {
      return {}
    }

    const channelValues: Record<string, unknown> = {}

    for (const blob of blobs) {
      if (blob.type === 'empty' || !blob.blob) {
        continue
      }

      // Convert BYTEA string from Supabase REST API
      // Data flow: Hex (from Supabase) -> Base64 string -> Actual data
      // All data is double-encoded through Supabase REST API
      const hexDecoded = hexToUint8Array(blob.blob)
      const base64String = uint8ArrayToString(hexDecoded)
      const actualData = base64ToUint8Array(base64String)
      const value = await this.serde.loadsTyped(blob.type, actualData)

      channelValues[blob.channel] = value
    }

    return channelValues
  }

  /**
   * Helper method to load metadata
   */
  private async _loadMetadata(metadata: Json): Promise<CheckpointMetadata> {
    return parseCheckpointMetadata(metadata)
  }

  /**
   * Helper method to load pending writes
   *
   * Supabase REST API specific implementation:
   * - Receives structured row objects with BYTEA data as hex-encoded strings
   * - Handles double encoding: hex -> base64 -> actual data
   * - Always expects string type for blob data (never Uint8Array)
   */
  private async _loadWrites(
    writes: Database['public']['Tables']['checkpoint_writes']['Row'][],
  ): Promise<[string, string, unknown][]> {
    if (!writes || writes.length === 0) {
      return []
    }

    const pendingWrites: [string, string, unknown][] = []

    for (const write of writes) {
      if (!write.blob) continue

      // Convert BYTEA string from Supabase REST API
      // Data flow: Hex (from Supabase) -> Base64 string -> Actual data
      // All data is double-encoded through Supabase REST API
      const hexDecoded = hexToUint8Array(write.blob)
      const base64String = uint8ArrayToString(hexDecoded)
      const uint8Array = base64ToUint8Array(base64String)

      const value = write.type
        ? await this.serde.loadsTyped(write.type, uint8Array)
        : uint8ArrayToString(uint8Array)

      pendingWrites.push([write.task_id, write.channel, value])
    }

    return pendingWrites
  }

  /**
   * Helper method to serialize checkpoint for storage
   */
  private _dumpCheckpoint(checkpoint: Checkpoint): SerializedCheckpoint {
    const channelVersions = this._copyChannelVersions(
      checkpoint.channel_versions,
    )
    const versionsSeen = this._copyVersionsSeen(checkpoint.versions_seen)

    const serialized: SerializedCheckpoint = {
      v: checkpoint.v || 1,
      id: checkpoint.id,
      ts: checkpoint.ts,
      channel_versions: channelVersions,
      versions_seen: versionsSeen,
    }

    // Don't store channel_values in checkpoint table
    // They go to the blobs table instead

    // pending_sends has been removed from Checkpoint type in langgraph-checkpoint 0.1.0

    return serialized
  }

  /**
   * Copy channel versions for serialization
   */
  private _copyChannelVersions(
    channelVersions?: ChannelVersions,
  ): Record<string, number | string> {
    const result: Record<string, number | string> = {}
    if (!channelVersions) return result

    for (const [key, value] of Object.entries(channelVersions)) {
      result[key] = value
    }
    return result
  }

  /**
   * Copy versions seen for serialization
   */
  private _copyVersionsSeen(
    versionsSeen?: Record<string, ChannelVersions>,
  ): Record<string, Record<string, number | string>> {
    const result: Record<string, Record<string, number | string>> = {}
    if (!versionsSeen) return result

    for (const [agent, versions] of Object.entries(versionsSeen)) {
      result[agent] = {}
      if (versions && typeof versions === 'object') {
        for (const [key, value] of Object.entries(versions)) {
          result[agent][key] = value
        }
      }
    }
    return result
  }

  /**
   * Helper method to serialize channel blobs
   */
  private async _dumpBlobs(
    threadId: string,
    checkpointNs: string,
    values: Record<string, unknown>,
    versions: ChannelVersions,
  ): Promise<Database['public']['Tables']['checkpoint_blobs']['Insert'][]> {
    if (!values || Object.keys(versions).length === 0) {
      return []
    }

    const blobs: Database['public']['Tables']['checkpoint_blobs']['Insert'][] =
      []

    for (const [channel, version] of Object.entries(versions)) {
      const value = values[channel]

      if (value === undefined || value === null) {
        blobs.push({
          thread_id: threadId,
          checkpoint_ns: checkpointNs,
          channel,
          version: version.toString(),
          type: 'empty',
          blob: null,
          organization_id: this.organizationId,
        })
      } else {
        const [type, serialized] = await this.serde.dumpsTyped(value)

        blobs.push({
          thread_id: threadId,
          checkpoint_ns: checkpointNs,
          channel,
          version: version.toString(),
          type,
          blob: uint8ArrayToBase64(serialized), // Convert to Base64 for Supabase BYTEA
          organization_id: this.organizationId,
        })
      }
    }

    return blobs
  }

  /**
   * Helper method to serialize metadata
   */
  private async _dumpMetadata(metadata: CheckpointMetadata): Promise<Json> {
    // Serialize metadata to ensure it's compatible with Json type
    return JSON.parse(JSON.stringify(metadata))
  }

  /**
   * Helper method to serialize pending writes
   */
  private async _dumpWrites(
    threadId: string,
    checkpointNs: string,
    checkpointId: string,
    taskId: string,
    writes: PendingWrite[],
  ): Promise<Database['public']['Tables']['checkpoint_writes']['Insert'][]> {
    const dumpedWrites: Database['public']['Tables']['checkpoint_writes']['Insert'][] =
      []

    for (let idx = 0; idx < writes.length; idx++) {
      const write = writes[idx]
      if (!write) continue
      const [channel, value] = write
      const [type, serialized] = await this.serde.dumpsTyped(value)

      dumpedWrites.push({
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpointId,
        task_id: taskId,
        idx: WRITES_IDX_MAP[channel] ?? idx,
        channel,
        type,
        blob: uint8ArrayToBase64(serialized), // Convert to Base64 for Supabase BYTEA
        organization_id: this.organizationId,
      })
    }

    return dumpedWrites
  }
}
