import type { CheckpointMetadata } from '@langchain/langgraph-checkpoint'
import * as v from 'valibot'
import type { SerializedCheckpoint } from './types'

/**
 * Schema for serialized checkpoint data stored in the database
 */
const SerializedCheckpointSchema = v.strictObject({
  v: v.number(),
  id: v.string(),
  ts: v.string(),
  channel_values: v.optional(v.record(v.string(), v.unknown())),
  channel_versions: v.record(v.string(), v.union([v.number(), v.string()])),
  versions_seen: v.record(
    v.string(),
    v.record(v.string(), v.union([v.number(), v.string()])),
  ),
})

/**
 * Schema for checkpoint metadata
 * LangGraph's CheckpointMetadata has required fields plus optional extra properties
 */
const CheckpointMetadataSchema = v.looseObject({
  source: v.union([
    v.literal('input'),
    v.literal('loop'),
    v.literal('update'),
    v.literal('fork'),
  ]),
  step: v.number(),
  parents: v.record(v.string(), v.string()),
})

/**
 * Parse JSON to SerializedCheckpoint with validation
 */
export const parseSerializedCheckpoint = (
  data: unknown,
): SerializedCheckpoint => {
  const parsed = v.parse(SerializedCheckpointSchema, data)
  // Ensure optional fields are not set to undefined
  const result: SerializedCheckpoint = {
    v: parsed.v,
    id: parsed.id,
    ts: parsed.ts,
    channel_versions: parsed.channel_versions,
    versions_seen: parsed.versions_seen,
  }
  if (parsed.channel_values !== undefined) {
    result.channel_values = parsed.channel_values
  }
  return result
}

/**
 * Parse and validate CheckpointMetadata
 * Returns the metadata if valid, otherwise returns a default metadata object
 */
export const parseCheckpointMetadata = (data: unknown): CheckpointMetadata => {
  return v.parse(CheckpointMetadataSchema, data)
}
