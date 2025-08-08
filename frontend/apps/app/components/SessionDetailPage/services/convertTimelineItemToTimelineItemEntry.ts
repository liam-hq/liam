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
    // Include artifact_action from backend if available
    artifactAction: timelineItem.artifact_action,
  }

  return match(timelineItem)
    .with(
      { type: 'schema_version', building_schema_version_id: P.string },
      (item): SchemaVersionTimelineItemEntry => ({
        ...baseItem,
        type: 'schema_version',
        buildingSchemaVersionId: item.building_schema_version_id,
        version: item.building_schema_versions,
      }),
    )
    .with(
      { type: 'user' },
      (item): UserTimelineItemEntry => ({
        ...baseItem,
        type: 'user',
        userName: item.users?.name,
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
    .with(
      {
        type: 'query_result',
        query_result_id: P.string,
        validation_queries: P.not(P.nullish),
      },
      (item): QueryResultTimelineItemEntry => {
        // Extract and format query results from validation data
        const validationResults =
          item.validation_queries?.validation_results || []
        const results = validationResults.flatMap((vr) =>
          (vr.result_set || []).map((result: unknown, index: number) => ({
            id: `${vr.id}-${index}`,
            sql: item.validation_queries?.query_string || '',
            success: vr.status === 'success',
            result: result,
            metadata: {
              executionTime: 0, // TODO: Not available in validation_results
              timestamp: vr.executed_at,
              affectedRows: null,
            },
          })),
        )

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
