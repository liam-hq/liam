'use client'

import type { FC, PropsWithChildren } from 'react'
import { match } from 'ts-pattern'
import type { TimelineItemEntry } from '../../../../types'
import { AgentMessage } from './components/AgentMessage'
import {
  DBAgent,
  PMAgent,
  QAAgent,
} from './components/AgentMessage/components/AgentAvatar'
import { ErrorMessage } from './components/ErrorMessage'
import { LogMessage } from './components/LogMessage'
import { UserMessage } from './components/UserMessage'
import { VersionMessage } from './components/VersionMessage'

type Props = PropsWithChildren &
  TimelineItemEntry & {
    isLastOfType?: boolean
  }

export const TimelineItem: FC<Props> = (props) => {
  const { isLastOfType } = props
  return match(props)
    .with({ type: 'schema_version' }, ({ buildingSchemaVersionId }) => (
      <AgentMessage state="default">
        <VersionMessage buildingSchemaVersionId={buildingSchemaVersionId} />
      </AgentMessage>
    ))
    .with({ type: 'user' }, ({ content, timestamp }) => (
      <UserMessage content={content} timestamp={timestamp} />
    ))
    .with({ type: 'assistant_log' }, ({ content, role }) => {
      return match(role)
        .with('db', () => (
          <AgentMessage
            state="default"
            avatar={<DBAgent />}
            agentName="DB Agent"
          >
            <LogMessage content={content} isLast={isLastOfType} />
          </AgentMessage>
        ))
        .with('pm', () => (
          <AgentMessage
            state="default"
            avatar={<PMAgent />}
            agentName="PM Agent"
          >
            <LogMessage content={content} isLast={isLastOfType} />
          </AgentMessage>
        ))
        .with('qa', () => (
          <AgentMessage
            state="default"
            avatar={<QAAgent />}
            agentName="QA Agent"
          >
            <LogMessage content={content} isLast={isLastOfType} />
          </AgentMessage>
        ))
        .exhaustive()
    })
    .with({ type: 'assistant' }, ({ content, role, timestamp, children }) => {
      return match(role)
        .with('db', () => (
          <AgentMessage
            state="default"
            avatar={<DBAgent />}
            agentName="DB Agent"
            message={content}
            time={timestamp?.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          >
            {children}
          </AgentMessage>
        ))
        .with('pm', () => (
          <AgentMessage
            state="default"
            avatar={<PMAgent />}
            agentName="PM Agent"
            message={content}
            time={timestamp?.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          >
            {children}
          </AgentMessage>
        ))
        .with('qa', () => (
          <AgentMessage
            state="default"
            avatar={<QAAgent />}
            agentName="QA Agent"
            message={content}
            time={timestamp?.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          >
            {children}
          </AgentMessage>
        ))
        .exhaustive()
    })
    .with({ type: 'error' }, ({ content, onRetry }) => (
      <AgentMessage state="default" avatar={<DBAgent />} agentName="DB Agent">
        <ErrorMessage message={content} onRetry={onRetry} />
      </AgentMessage>
    ))
    .exhaustive()
}
