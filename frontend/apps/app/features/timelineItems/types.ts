import type { Database } from '@liam-hq/db'
import type { ReactNode } from 'react'
import type { DesignSessionWithTimelineItems } from '@/components/SessionDetailPage/services/designSessionWithTimelineItems/types'

// TODO: Modify to use what is inferred from the valibot schema
export type TimelineItem =
  | {
      content: string
      role: Database['public']['Enums']['timeline_item_type_enum']
      timestamp?: Date
      avatarSrc?: string
      avatarAlt?: string
      initial?: string
      /**
       * Optional children to render below the message content
       */
      children?: ReactNode
    }
  | {
      id: string
      role: 'schema_version'
      content: string
      building_schema_version_id: string
    }

export type TimelineItemEntry = TimelineItem & {
  id: string
}

// TODO: Modify to use what is inferred from the valibot schema
export type TimelineItemType =
  NonNullable<DesignSessionWithTimelineItems>['timeline_items'][number]
