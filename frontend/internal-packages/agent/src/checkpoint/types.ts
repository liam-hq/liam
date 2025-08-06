import type { SerializerProtocol } from '@langchain/langgraph-checkpoint'
import type { SupabaseClientType } from '@liam-hq/db'

/**
 * Configuration options for SupabaseCheckpointSaver
 */
export type SupabaseCheckpointSaverOptions = {
  /**
   * Organization ID for data isolation via RLS
   */
  organizationId: string

  /**
   * Enable automatic cleanup of old checkpoints
   * @default false
   */
  enableCleanup?: boolean

  /**
   * Maximum number of checkpoints to keep per thread
   * @default 50
   */
  maxCheckpoints?: number

  /**
   * Cleanup interval in milliseconds
   * @default 3600000 (1 hour)
   */
  cleanupIntervalMs?: number
}

/**
 * Internal database row types for checkpoint tables
 */
export type CheckpointRow = {
  id: string
  organization_id: string
  thread_id: string
  checkpoint_ns: string
  checkpoint_id: string
  parent_checkpoint_id: string | null
  checkpoint: unknown
  metadata: unknown
  created_at: string
  updated_at: string
}

export type CheckpointBlobRow = {
  id: string
  organization_id: string
  thread_id: string
  checkpoint_ns: string
  channel: string
  version: string
  type: string
  blob: string | null
  created_at: string
  updated_at: string
}

export type CheckpointWriteRow = {
  id: string
  organization_id: string
  thread_id: string
  checkpoint_ns: string
  checkpoint_id: string
  task_id: string
  idx: number
  channel: string
  type: string | null
  blob: string
  created_at: string
  updated_at: string
}

/**
 * Constructor parameters for SupabaseCheckpointSaver
 */
export type SupabaseCheckpointSaverParams = {
  client: SupabaseClientType
  serde?: SerializerProtocol
  options: SupabaseCheckpointSaverOptions
}
