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
import { GroupedLogMessage } from './components/GroupedLogMessage'
import { LogMessage } from './components/LogMessage'
import { UserMessage } from './components/UserMessage'
import { VersionMessage } from './components/VersionMessage'
import type { BuildingSchemaVersion } from './components/VersionMessage/VersionMessage'

type Props = PropsWithChildren &
  TimelineItemEntry & {
    onRetry?: () => void
    mockVersionData?: BuildingSchemaVersion
    groupedMessages?: string[]
  }

export const TimelineItem: FC<Props> = (props) => {
  const { onRetry, mockVersionData, groupedMessages } = props

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
        {groupedMessages ? (
          <GroupedLogMessage messages={groupedMessages} />
        ) : (
          <LogMessage content={content} />
        )}
      </AgentMessage>
    ))
    .with({ type: 'assistant_pm' }, ({ content }) => (
      <AgentMessage state="default" avatar={<PMAgent />} agentName="PM Agent">
        {groupedMessages ? (
          <GroupedLogMessage messages={groupedMessages} />
        ) : (
          <LogMessage content={content} />
        )}
      </AgentMessage>
    ))
    .with({ type: 'assistant_db' }, ({ content }) => (
      <AgentMessage state="default" avatar={<DBAgent />} agentName="DB Agent">
        {groupedMessages ? (
          <GroupedLogMessage messages={groupedMessages} />
        ) : (
          <LogMessage content={content} />
        )}
      </AgentMessage>
    ))
    .with({ type: 'assistant_qa' }, ({ content }) => (
      <AgentMessage state="default" avatar={<QAAgent />} agentName="QA Agent">
        {groupedMessages ? (
          <GroupedLogMessage messages={groupedMessages} />
        ) : (
          <LogMessage content={content} />
        )}
      </AgentMessage>
    ))
    .with({ type: 'error' }, ({ content }) => (
      <AgentMessage state="default" avatar={<DBAgent />} agentName="DB Agent">
        <ErrorMessage message={content} onRetry={onRetry} />
      </AgentMessage>
    ))
    .otherwise(({ content, timestamp, children }) => {
      // For assistant type, use grouped messages if available
      if (props.type === 'assistant' && groupedMessages) {
        return (
          <AgentMessage
            state="default"
            time={timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          >
            <GroupedLogMessage messages={groupedMessages} />
          </AgentMessage>
        )
      }

      return (
        <AgentMessage
          state="default"
          message={content}
          time={timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        >
          {children}
        </AgentMessage>
      )
    })
}
