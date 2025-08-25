/**
 * Internal types for serialization
 */
export type SerializedCheckpoint = {
  v: number
  id: string
  ts: string
  channel_values?: Record<string, unknown>
  channel_versions: Record<string, number | string>
  versions_seen: Record<string, Record<string, number | string>>
}
