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
import { ViewLink } from './components/ViewLink'
import { PM_AGENT_ROLE, QA_AGENT_ROLE } from './constants'

type Props = PropsWithChildren &
  TimelineItemEntry & {
    showHeader?: boolean
    onArtifactLinkClick: () => void
  }

type ViewLinkConfig = {
  text: string
}

const getViewLinkConfig = (
  role: string,
  artifactAction?: 'created' | 'updated' | null,
): ViewLinkConfig | null => {
  // Only show link when artifact was created or updated in this message
  if (!artifactAction || artifactAction === null) {
    return null
  }

  // TODO: Once backend implements artifact_action field, remove the following comment
  // Currently this feature requires backend to track when artifacts are created/updated
  if (role === PM_AGENT_ROLE) {
    return { text: 'View Requirements' }
  }

  if (role === QA_AGENT_ROLE) {
    return { text: 'View Use Cases' }
  }

  return null
}

export const TimelineItem: FC<Props> = (props) => {
  const { showHeader = true, onArtifactLinkClick, ...timelineItemProps } = props

  return match(timelineItemProps)
    .with({ type: 'schema_version' }, ({ version, onView }) => (
      <AgentMessage state="default" assistantRole="db" showHeader={showHeader}>
        <VersionMessage version={version} onView={onView} />
      </AgentMessage>
    ))
    .with({ type: 'query_result' }, ({ queryResultId, results }) => (
      <AgentMessage state="default" assistantRole="db" showHeader={showHeader}>
        <QueryResultMessage
          queryResultId={queryResultId}
          results={Array.isArray(results) ? results : undefined}
        />
      </AgentMessage>
    ))
    .with({ type: 'user' }, ({ content, timestamp, userName }) => (
      <UserMessage
        content={content}
        timestamp={timestamp}
        userName={userName}
      />
    ))
    .with({ type: 'assistant_log' }, ({ content, role, artifactAction }) => {
      const viewLinkConfig = getViewLinkConfig(role, artifactAction)
      return (
        <AgentMessage
          state="default"
          assistantRole={role}
          showHeader={showHeader}
        >
          <LogMessage content={content} />
          {viewLinkConfig && (
            <ViewLink
              text={viewLinkConfig.text}
              onClick={onArtifactLinkClick}
              ariaLabel={`Navigate to ${viewLinkConfig.text.toLowerCase()} tab`}
            />
          )}
        </AgentMessage>
      )
    })
    .with(
      { type: 'assistant' },
      ({ content, role, timestamp, children, artifactAction }) => {
        const viewLinkConfig = getViewLinkConfig(role, artifactAction)
        return (
          <AgentMessage
            state="default"
            assistantRole={role}
            message={content}
            time={timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            showHeader={showHeader}
          >
            {children}
            {viewLinkConfig && (
              <ViewLink
                text={viewLinkConfig.text}
                onClick={onArtifactLinkClick}
                ariaLabel={`Navigate to ${viewLinkConfig.text.toLowerCase()} tab`}
              />
            )}
          </AgentMessage>
        )
      },
    )
    .with({ type: 'error' }, ({ content, onRetry }) => (
      <AgentMessage state="default" assistantRole="db" showHeader={showHeader}>
        <ErrorMessage message={content} onRetry={onRetry} />
      </AgentMessage>
    ))
    .exhaustive()
}
