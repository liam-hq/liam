import type { Database } from '@liam-hq/db'
import type { ReactNode } from 'react'

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
  | {
      id: string
      content: string
      type: Database['public']['Enums']['timeline_item_type_enum']
      user_id: string | null
      created_at: string
      updated_at: string
      organization_id: string
      design_session_id: string
      building_schema_version_id: string | null
    }
  | {
      id: string
      type: 'schema_version'
      content: string
      building_schema_version_id: string
    }
