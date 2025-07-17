import { match, P } from 'ts-pattern'
import type {
  AssistantLogTimelineItemEntry,
  AssistantTimelineItemEntry,
  ErrorTimelineItemEntry,
  QueryResultTimelineItemEntry,
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
    .with(
      {
        type: 'query_result',
        query_result_id: P.string,
        query_results: P.array(),
      },
      (item): QueryResultTimelineItemEntry => {
        let results = item.query_results

        // Parse the results if they are an array
        if (Array.isArray(results)) {
          results = results.map((r) => {
            if (typeof r === 'object' && r !== null && 'result' in r) {
              return {
                ...r,
                result:
                  typeof r.result === 'string'
                    ? JSON.parse(r.result)
                    : r.result,
              }
            }
            return r
          })
        }

        return {
          ...baseItem,
          type: 'query_result',
          queryResultId: item.query_result_id,
          results,
        }
      },
    )
    .otherwise((item) => {
      console.warn(`Unknown timeline item type: ${item.type}`)
      return {
        ...baseItem,
        type: 'user' as const,
      }
    })
}
