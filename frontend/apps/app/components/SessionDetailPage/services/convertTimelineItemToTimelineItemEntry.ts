import { match, P } from 'ts-pattern'
import type {
  AssistantLogTimelineItemEntry,
  AssistantTimelineItemEntry,
  ErrorTimelineItemEntry,
  SchemaVersionTimelineItemEntry,
  TimelineItem,
  TimelineItemEntry,
  UserTimelineItemEntry,
} from '../types'

export const convertTimelineItemToTimelineItemEntry = (
  timelineItem: TimelineItem,
): TimelineItemEntry => {
  const baseItem = {
    id: timelineItem.id,
    content: timelineItem.content,
    timestamp: new Date(timelineItem.created_at),
  }

  return match(timelineItem)
    .with(
      { type: 'schema_version', building_schema_version_id: P.string },
      (item): SchemaVersionTimelineItemEntry => ({
        ...baseItem,
        type: 'schema_version',
        buildingSchemaVersionId: item.building_schema_version_id,
      }),
    )
    .with(
      { type: 'user' },
      (): UserTimelineItemEntry => ({
        ...baseItem,
        type: 'user',
      }),
    )
    .with(
      { type: 'assistant' },
      (item): AssistantTimelineItemEntry => ({
        ...baseItem,
        type: 'assistant',
        role: item.assistant_role ?? 'db',
      }),
    )
    .with(
      { type: 'error' },
      (): ErrorTimelineItemEntry => ({
        ...baseItem,
        type: 'error',
      }),
    )
    .with(
      { type: 'assistant_log' },
      (item): AssistantLogTimelineItemEntry => ({
        ...baseItem,
        type: 'assistant_log',
        role: item.assistant_role ?? 'db',
      }),
    )
    .otherwise((item) => {
      console.warn(`Unknown timeline item type: ${item.type}`)
      return {
        ...baseItem,
        type: 'user' as const,
      }
    })
}
