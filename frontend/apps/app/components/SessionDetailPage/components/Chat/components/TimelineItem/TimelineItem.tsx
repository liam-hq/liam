'use client'

import type {
  DDLExecutionResult,
  DMLExecutionResult,
} from '@liam-hq/agent/src/chat/workflow/types'
import type { FC } from 'react'
import type { TimelineItem as TimelineItemProps } from '@/features/timelineItems/types'
import { AgentMessage } from './components/AgentMessage'
import { ExecutionResultMessage } from './components/ExecutionResultMessage'
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

  if (role === 'ddl_execution_result') {
    try {
      const executionResult: DDLExecutionResult = JSON.parse(content)
      return (
        <AgentMessage state="default">
          <ExecutionResultMessage result={executionResult} type="ddl" />
        </AgentMessage>
      )
    } catch (error) {
      console.error('Failed to parse DDL execution result:', error)
      return (
        <AgentMessage
          state="default"
          message="Failed to display DDL execution result"
          time={formattedTime || ''}
        />
      )
    }
  }

  if (role === 'dml_execution_result') {
    try {
      const executionResult: DMLExecutionResult = JSON.parse(content)
      return (
        <AgentMessage state="default">
          <ExecutionResultMessage result={executionResult} type="dml" />
        </AgentMessage>
      )
    } catch (error) {
      console.error('Failed to parse DML execution result:', error)
      return (
        <AgentMessage
          state="default"
          message="Failed to display DML execution result"
          time={formattedTime || ''}
        />
      )
    }
  }

  return (
    <AgentMessage state="default" message={content} time={formattedTime || ''}>
      {children}
    </AgentMessage>
  )
}
