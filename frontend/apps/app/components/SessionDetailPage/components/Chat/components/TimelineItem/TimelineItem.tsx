'use client'

import type { FC } from 'react'
import type { TimelineItem as TimelineItemProps } from '@/features/timelineItems/types'
import { AgentMessage } from './components/AgentMessage'
import { LogMessage } from './components/LogMessage'
import { UserMessage } from './components/UserMessage'
import { VersionMessage } from './components/VersionMessage'

type Props = TimelineItemProps

export const TimelineItem: FC<Props> = (props) => {
  // Handle schema_version role separately
  if ('building_schema_version_id' in props) {
    return (
      <AgentMessage state="default">
        <VersionMessage
          buildingSchemaVersionId={props.building_schema_version_id}
        />
      </AgentMessage>
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

  if (role === 'user') {
    return (
      <UserMessage
        content={content}
        timestamp={timestamp}
        avatarSrc={avatarSrc}
        avatarAlt={avatarAlt}
        initial={initial}
      />
    )
  }

  if (role === 'assistant_log') {
    return (
      <AgentMessage state="default">
        <LogMessage content={content} />
      </AgentMessage>
    )
  }

  return (
    <AgentMessage state="default" message={content} time={formattedTime || ''}>
      {children}
    </AgentMessage>
  )
}
