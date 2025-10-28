'use client'

import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import * as Sentry from '@sentry/nextjs'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient as createSupabaseClient } from '../../../../libs/db/client'
import { urlgen } from '../../../../libs/routes'
import itemStyles from '../Item.module.css'
import { fetchFilteredSessions, loadMoreSessions } from './actions'
import {
  type OrganizationMember,
  SessionFilterDropdown,
} from './components/SessionFilterDropdown'
import { RecentSessionItem } from './RecentSessionItem'
import styles from './RecentsSectionClient.module.css'
import { Skeleton } from './Skeleton'
import type { RecentSession, SessionFilterType } from './types'

type RecentsSectionClientProps = {
  sessions: RecentSession[]
  organizationMembers: OrganizationMember[]
  currentUserId: string
  organizationId: string
}

const PAGE_SIZE = 20
const SKELETON_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const RecentsSectionClient = ({
  sessions: initialSessions,
  organizationMembers,
  currentUserId,
  organizationId,
}: RecentsSectionClientProps) => {
  const pathname = usePathname()
  const [sessions, setSessions] = useState<RecentSession[]>(initialSessions)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialSessions.length >= PAGE_SIZE)
  const [filterType, setFilterType] = useState<SessionFilterType>('me')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const sessionsListRef = useRef<HTMLElement | null>(null)
  const sessionsRef = useRef(initialSessions)
  const runIdToSessionMap = useRef(new Map<string, string>())

  const handleFilterChange = useCallback(async (newFilterType: string) => {
    const nextFilterType: SessionFilterType = newFilterType
    setFilterType(nextFilterType)
    setIsLoading(true)

    const sessionsResult = await fromAsyncThrowable(() =>
      fetchFilteredSessions(nextFilterType),
    )()

    if (sessionsResult.isErr()) {
      Sentry.captureException(sessionsResult.error)
      setIsLoading(false)
      return
    }

    const newSessions = sessionsResult.value
    setSessions(newSessions)
    setHasMore(newSessions.length >= PAGE_SIZE)
    setIsLoading(false)
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    const newSessionsResult = await fromAsyncThrowable(() =>
      loadMoreSessions({
        limit: PAGE_SIZE,
        offset: sessionsRef.current.length,
        filterType,
      }),
    )()

    if (newSessionsResult.isErr()) {
      Sentry.captureException(newSessionsResult.error)
      setIsLoading(false)
      return
    }

    const newSessions = newSessionsResult.value

    if (newSessions.length === 0) {
      setHasMore(false)
      setIsLoading(false)
      return
    }

    setSessions((prevSessions) => [...prevSessions, ...newSessions])
    setHasMore(newSessions.length >= PAGE_SIZE)
    setIsLoading(false)
  }, [filterType, hasMore, isLoading])

  useEffect(() => {
    sessionsRef.current = sessions
    const map = runIdToSessionMap.current
    map.clear()
    sessions.forEach((session) => {
      if (session.latest_run_id) {
        map.set(session.latest_run_id, session.id)
      }
    })
  }, [sessions])

  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current
    const currentSessionsListRef = sessionsListRef.current

    if (!currentLoadMoreRef || !currentSessionsListRef) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          loadMore()
        }
      },
      {
        root: currentSessionsListRef,
        rootMargin: '100px',
        threshold: 0.1,
      },
    )

    observerRef.current.observe(currentLoadMoreRef)

    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef)
      }
    }
  }, [loadMore])

  useEffect(() => {
    const supabase = createSupabaseClient()

    const getRecord = (value: unknown) => (isRecord(value) ? value : null)

    const extractNewRow = (payload: unknown) => {
      if (!isRecord(payload)) {
        return null
      }

      return getRecord(payload['new'])
    }

    const getStringField = (record: Record<string, unknown>, key: string) => {
      const value = record[key]
      return typeof value === 'string' ? value : null
    }

    const handleRunInsert = (payload: unknown) => {
      const newRow = extractNewRow(payload)
      if (!newRow) {
        return
      }

      const runId = getStringField(newRow, 'id')
      const sessionId = getStringField(newRow, 'design_session_id')

      if (!runId || !sessionId) {
        return
      }

      runIdToSessionMap.current.set(runId, sessionId)

      if (!sessionsRef.current.some((session) => session.id === sessionId)) {
        return
      }

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                status: 'pending',
                latest_run_id: runId,
              }
            : session,
        ),
      )
    }

    const resolveSessionIdForRun = async (
      runId: string,
      eventType: string,
    ): Promise<string | null> => {
      const cachedSessionId = runIdToSessionMap.current.get(runId)
      if (cachedSessionId) {
        return cachedSessionId
      }

      const { data, error } = await supabase
        .from('runs')
        .select('design_session_id')
        .eq('id', runId)
        .maybeSingle()

      if (error || !data) {
        Sentry.captureException(error ?? new Error('Run not found for event'), {
          extra: { runId, eventType },
        })
        return null
      }

      const sessionId = data.design_session_id
      if (typeof sessionId === 'string') {
        runIdToSessionMap.current.set(runId, sessionId)
        return sessionId
      }

      return null
    }

    const applyRunEvent = (
      sessionId: string,
      runId: string,
      eventType: string,
    ) => {
      const nextStatus: RecentSession['status'] =
        eventType === 'error'
          ? 'error'
          : eventType === 'completed'
            ? 'success'
            : 'pending'

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                status: nextStatus,
                latest_run_id:
                  eventType === 'started'
                    ? runId
                    : (session.latest_run_id ?? runId),
              }
            : session,
        ),
      )
    }

    const handleRunEvent = async (payload: unknown) => {
      const newRow = extractNewRow(payload)
      if (!newRow) {
        return
      }

      const runId = getStringField(newRow, 'run_id')
      const eventType = getStringField(newRow, 'event_type')

      if (!runId || !eventType) {
        return
      }

      const sessionId = await resolveSessionIdForRun(runId, eventType)
      if (!sessionId) {
        return
      }

      runIdToSessionMap.current.set(runId, sessionId)
      applyRunEvent(sessionId, runId, eventType)
    }

    const runsChannel = supabase
      .channel('runs_recents')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'runs',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => handleRunInsert(payload),
      )
      .subscribe()

    const runEventsChannel = supabase
      .channel('run_events_recents')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'run_events',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          void handleRunEvent(payload)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(runsChannel)
      supabase.removeChannel(runEventsChannel)
    }
  }, [organizationId])

  return (
    <>
      <div className={clsx(itemStyles.item, styles.recentsCollapsed)}>
        <div className={itemStyles.labelArea}>
          <span className={itemStyles.label}>Recents</span>
        </div>
      </div>
      <div className={styles.recentsExpanded}>
        <div className={styles.recentsSection}>
          <SessionFilterDropdown
            filterType={filterType}
            organizationMembers={organizationMembers}
            currentUserId={currentUserId}
            onFilterChange={handleFilterChange}
          />

          {sessions.length > 0 ? (
            <nav
              ref={sessionsListRef}
              className={styles.sessionsList}
              aria-label="Recent sessions"
            >
              {sessions.map((session) => {
                const sessionUrl = urlgen('design_sessions/[id]', {
                  id: session.id,
                })
                const isActive = pathname === sessionUrl
                const showOwner = filterType !== 'me'

                return (
                  <RecentSessionItem
                    key={session.id}
                    session={session}
                    isActive={isActive}
                    showOwner={showOwner}
                  />
                )
              })}
              {hasMore && (
                <div ref={loadMoreRef} className={styles.loadMoreTrigger} />
              )}
              {isLoading && (
                <div className={styles.loadingState}>
                  {SKELETON_KEYS.map((key) => (
                    <div key={key} className={styles.skeletonItem}>
                      <Skeleton width="80%" height="1rem" />
                      <Skeleton width="40%" height="0.75rem" />
                    </div>
                  ))}
                </div>
              )}
            </nav>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyText}>No recent sessions</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
