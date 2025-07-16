'use client'

import type { FC } from 'react'
import type { TimelineItemEntry } from '../../../../types'
import { AgentMessage } from './components/AgentMessage'
import { ExecutionResultMessage } from './components/ExecutionResultMessage'
import { LogMessage } from './components/LogMessage'
import { UserMessage } from './components/UserMessage'
import { VersionMessage } from './components/VersionMessage'

type Props = TimelineItemEntry

export const TimelineItem: FC<Props> = (props) => {
  if ('buildingSchemaVersionId' in props) {
    return (
      <AgentMessage state="default">
        <VersionMessage
          buildingSchemaVersionId={props.buildingSchemaVersionId}
        />
      </AgentMessage>
    )
  }

  const { content, type, timestamp } = props

  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  if (type === 'user') {
    return <UserMessage content={content} timestamp={timestamp} />
  }

  if (type === 'assistant_log') {
    return (
      <AgentMessage state="default">
        <LogMessage content={content} />
      </AgentMessage>
    )
  }

  if (type === 'ddl_execution_result') {
    return (
      <AgentMessage state="default">
        <ExecutionResultMessage result={{ content }} type="ddl" />
      </AgentMessage>
    )
  }

  if (type === 'dml_execution_result') {
    return (
      <AgentMessage state="default">
        <ExecutionResultMessage result={{ content }} type="dml" />
      </AgentMessage>
    )
  }

  return (
    <AgentMessage
      state="default"
      message={content}
      time={formattedTime || ''}
    />
  )
}
