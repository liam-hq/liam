'use client'

import type { FC, PropsWithChildren } from 'react'
import { match } from 'ts-pattern'
import type { TimelineItemEntry } from '../../../../types'
import { AgentMessage } from './components/AgentMessage'
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
      <AgentMessage state="default" assistantRole="db">
        <VersionMessage buildingSchemaVersionId={buildingSchemaVersionId} />
      </AgentMessage>
    ))
    .with({ type: 'user' }, ({ content, timestamp }) => (
      <UserMessage content={content} timestamp={timestamp} />
    ))
    .with({ type: 'assistant_log' }, ({ content, role }) => (
      <AgentMessage state="default" assistantRole={role}>
        <LogMessage content={content} isLast={isLastOfType} />
      </AgentMessage>
    ))
    .with({ type: 'assistant' }, ({ content, role, timestamp, children }) => (
      <AgentMessage
        state="default"
        assistantRole={role}
        message={content}
        time={timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      >
        {children}
      </AgentMessage>
    ))
    .with({ type: 'error' }, ({ content, onRetry }) => (
      <AgentMessage state="default" assistantRole="db">
        <ErrorMessage message={content} onRetry={onRetry} />
      </AgentMessage>
    ))
    .exhaustive()
}
