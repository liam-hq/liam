'use client'

import type { Database } from '@liam-hq/db'
import type { FC, ReactNode } from 'react'
import { AgentMessage } from '@/components/Chat/AgentMessage'
import { ProcessIndicator } from '@/components/Chat/ProcessIndicator'
import { UserMessage } from '@/components/Chat/UserMessage'
import { VersionMessage } from '@/components/Chat/VersionMessage'
import styles from './TimelineItem.module.css'

export type TimelineItemProps =
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
  | {
      role: 'progress'
      content: string
      progress: number
    }

export const TimelineItem: FC<TimelineItemProps> = (props) => {
  // Handle schema_version role separately
  if ('building_schema_version_id' in props) {
    return (
      <div className={styles.messageContainer}>
        <VersionMessage
          buildingSchemaVersionId={props.building_schema_version_id}
        />
      </div>
    )
  }

  // Handle progress role separately
  if (props.role === 'progress' && 'progress' in props) {
    const progress = props.progress
    return (
      <ProcessIndicator
        initialExpanded
        title="Processing AI Message"
        subtitle={props.content}
        progress={progress}
        status={progress >= 100 ? 'complete' : 'processing'}
      />
    )
  }

  // Destructure props for regular messages
  const { content, role, timestamp, avatarSrc, avatarAlt, initial, children } =
    props

  // Only format and display timestamp if it exists
  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className={styles.messageContainer}>
      {role === 'user' ? (
        <UserMessage
          content={content}
          timestamp={timestamp}
          avatarSrc={avatarSrc}
          avatarAlt={avatarAlt}
          initial={initial}
        />
      ) : (
        <AgentMessage
          state="default"
          message={content}
          time={formattedTime || ''}
        >
          {children}
        </AgentMessage>
      )}
    </div>
  )
}
