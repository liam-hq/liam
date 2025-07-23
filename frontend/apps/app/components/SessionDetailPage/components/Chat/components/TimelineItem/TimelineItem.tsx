'use client'

import type { FC, PropsWithChildren } from 'react'
import { match } from 'ts-pattern'
import type { TimelineItemEntry } from '../../../../types'
import { AgentMessage } from './components/AgentMessage'
import { ErrorMessage } from './components/ErrorMessage'
import { LogMessage } from './components/LogMessage'
import { QueryResultMessage } from './components/QueryResultMessage'
import { UserMessage } from './components/UserMessage'
import { VersionMessage } from './components/VersionMessage'

type Props = PropsWithChildren & TimelineItemEntry

export const TimelineItem: FC<Props> = (props) => {
  return match(props)
    .with({ type: 'schema_version' }, ({ buildingSchemaVersionId }) => (
      <AgentMessage state="default" assistantRole="db">
        <VersionMessage buildingSchemaVersionId={buildingSchemaVersionId} />
      </AgentMessage>
    ))
    .with({ type: 'query_result' }, ({ queryResultId, results }) => (
      <AgentMessage state="default" assistantRole="db">
        <QueryResultMessage
          queryResultId={queryResultId}
          results={Array.isArray(results) ? results : undefined}
        />
      </AgentMessage>
    ))
    .with({ type: 'user' }, ({ content, timestamp }) => (
      <UserMessage content={content} timestamp={timestamp} />
    ))
    .with({ type: 'assistant_log' }, ({ content, role, isError }) => (
      <AgentMessage state="default" assistantRole={role} isError={isError}>
        <LogMessage content={content} />
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
