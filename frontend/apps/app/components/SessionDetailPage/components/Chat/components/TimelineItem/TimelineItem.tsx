'use client'

import type { FC, PropsWithChildren } from 'react'
import { match } from 'ts-pattern'
import type {
  AssistantDbTimelineItemEntry,
  AssistantPmTimelineItemEntry,
  AssistantQaTimelineItemEntry,
  TimelineItemEntry,
} from '../../../../types'
import { AgentMessage } from './components/AgentMessage'
import {
  DBAgent,
  PMAgent,
  QAAgent,
} from './components/AgentMessage/components/AgentAvatar'
import { ErrorMessage, ErrorMessageContent } from './components/ErrorMessage'
import { LogMessage } from './components/LogMessage'
import { UserMessage } from './components/UserMessage'
import { VersionMessage } from './components/VersionMessage'
import type { BuildingSchemaVersion } from './components/VersionMessage/VersionMessage'

type Props = PropsWithChildren &
  TimelineItemEntry & {
    onRetry?: () => void
    mockVersionData?: BuildingSchemaVersion
    isLastOfType?: boolean
  }

export const TimelineItem: FC<Props> = (props) => {
  const { onRetry, mockVersionData, isLastOfType } = props

  return match(props)
    .with({ type: 'schema_version' }, ({ buildingSchemaVersionId }) => (
      <AgentMessage state="default">
        <VersionMessage
          buildingSchemaVersionId={buildingSchemaVersionId}
          mockVersionData={mockVersionData}
        />
      </AgentMessage>
    ))
    .with({ type: 'user' }, ({ content, timestamp }) => (
      <UserMessage content={content} timestamp={timestamp} />
    ))
    .with({ type: 'assistant_log' }, ({ content }) => (
      <AgentMessage state="default">
        <LogMessage content={content} />
      </AgentMessage>
    ))
    .with({ type: 'assistant_pm' }, ({ content }) => (
      <AgentMessage state="default" avatar={<PMAgent />} agentName="PM Agent">
        <LogMessage content={content} isLast={isLastOfType} />
      </AgentMessage>
    ))
    .with({ type: 'assistant_db' }, ({ content }) => (
      <AgentMessage state="default" avatar={<DBAgent />} agentName="DB Agent">
        <LogMessage content={content} isLast={isLastOfType} />
      </AgentMessage>
    ))
    .with({ type: 'assistant_qa' }, ({ content }) => (
      <AgentMessage state="default" avatar={<QAAgent />} agentName="QA Agent">
        <LogMessage content={content} isLast={isLastOfType} />
      </AgentMessage>
    ))
    .with({ type: 'error' }, ({ content }) => (
      <AgentMessage state="default" avatar={<DBAgent />} agentName="DB Agent">
        <ErrorMessage message={content} onRetry={onRetry} />
      </AgentMessage>
    ))
    .with({ type: 'assistant' }, ({ content, timestamp }) => (
      <AgentMessage
        state="default"
        avatar={<DBAgent />}
        agentName="DB Agent"
        message={content}
        time={timestamp?.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      />
    ))
    .otherwise(() => {
      // This should never happen as all cases are handled
      return null
    })
}
