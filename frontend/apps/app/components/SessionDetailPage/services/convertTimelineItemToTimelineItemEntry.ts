import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { match, P } from 'ts-pattern'
import type {
  AssistantLogTimelineItemEntry,
  AssistantTimelineItemEntry,
  DdlExecutionTimelineItemEntry,
  DmlExecutionTimelineItemEntry,
  ErrorTimelineItemEntry,
  SchemaVersionTimelineItemEntry,
  TimelineItem,
  TimelineItemEntry,
  UserTimelineItemEntry,
} from '../types'

const extractSqlResults = (item: unknown): SqlResult[] => {
  if (
    typeof item === 'object' &&
    item !== null &&
    'metadata' in item &&
    item.metadata &&
    typeof item.metadata === 'object' &&
    'sqlResults' in item.metadata
  ) {
    const sqlResults = item.metadata.sqlResults
    return Array.isArray(sqlResults) ? sqlResults : []
  }
  return []
}

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
      (): AssistantTimelineItemEntry => ({
        ...baseItem,
        type: 'assistant',
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
      (): AssistantLogTimelineItemEntry => ({
        ...baseItem,
        type: 'assistant_log',
      }),
    )
    .otherwise((item) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-member-access
      const itemType = (item as any).type
      if (itemType === 'ddl_execution') {
        return {
          ...baseItem,
          type: 'ddl_execution',
          sqlResults: extractSqlResults(item),
        }
      }
      if (itemType === 'dml_execution') {
        return {
          ...baseItem,
          type: 'dml_execution',
          sqlResults: extractSqlResults(item),
        }
      }

      console.warn(`Unknown timeline item type: ${item.type}`)
      return {
        ...baseItem,
        type: 'user' as const,
      }
    })
}
