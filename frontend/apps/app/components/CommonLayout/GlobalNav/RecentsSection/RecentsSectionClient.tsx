'use client'

import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { Skeleton } from '@liam-hq/ui'
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

const toSessionStatus = (status: unknown): RecentSession['status'] => {
  if (status === 'error') {
    return 'error'
  }

  if (status === 'completed' || status === 'success') {
    return 'completed'
  }

  return 'running'
}
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
  const supabaseRef = useRef<ReturnType<typeof createSupabaseClient> | null>(
    null,
  )
  const refreshStateRef = useRef<
    Map<
      string,
      {
        inFlight: boolean
        needsRefresh: boolean
        latestRunIdHint: string | null
      }
    >
  >(new Map())

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
    const runMap = runIdToSessionMap.current
    runMap.clear()
    sessions.forEach((session) => {
      if (session.latest_run_id) {
        runMap.set(session.latest_run_id, session.id)
      }
    })
  }, [sessions])

  const refreshSession = useCallback(
    async (designSessionId: string, latestRunIdHint?: string) => {
      const supabase = supabaseRef.current
      if (!supabase) {
        return
      }

      if (
        !sessionsRef.current.some((session) => session.id === designSessionId)
      ) {
        return
      }

      const readSessionSnapshot = async () => {
        const [statusResult, runResult] = await Promise.all([
          supabase
            .from('run_status')
            .select('status')
            .eq('design_session_id', designSessionId)
            .maybeSingle(),
          supabase
            .from('runs')
            .select('id')
            .eq('design_session_id', designSessionId)
            .maybeSingle(),
        ])

        if (statusResult.error) {
          console.error(
            'Error refreshing run status for recents:',
            statusResult.error,
          )
        }

        if (runResult.error) {
          console.error(
            'Error refreshing run metadata for recents:',
            runResult.error,
          )
        }

        const statusValue =
          typeof statusResult.data?.status === 'string'
            ? statusResult.data.status
            : null

        return {
          normalizedStatus: toSessionStatus(statusValue),
          fetchedRunId:
            typeof runResult.data?.id === 'string' ? runResult.data.id : null,
        }
      }

      const stateMap = refreshStateRef.current
      let state = stateMap.get(designSessionId)
      if (!state) {
        state = {
          inFlight: false,
          needsRefresh: false,
          latestRunIdHint: null,
        }
        stateMap.set(designSessionId, state)
      }

      if (typeof latestRunIdHint === 'string') {
        state.latestRunIdHint = latestRunIdHint
      }

      if (state.inFlight) {
        state.needsRefresh = true
        return
      }

      state.inFlight = true

      const runRefreshCycle = async () => {
        do {
          state.needsRefresh = false
          const hint = state.latestRunIdHint
          state.latestRunIdHint = null
          const { normalizedStatus, fetchedRunId } = await readSessionSnapshot()
          const nextRunId = hint ?? fetchedRunId ?? null

          if (nextRunId) {
            runIdToSessionMap.current.set(nextRunId, designSessionId)
          }

          setSessions((prev) =>
            prev.map((session) =>
              session.id === designSessionId
                ? {
                    ...session,
                    status: normalizedStatus,
                    latest_run_id: nextRunId ?? session.latest_run_id,
                  }
                : session,
            ),
          )
        } while (state.needsRefresh)
      }

      runRefreshCycle()
        .catch((error) => {
          console.error('Unexpected error refreshing session state:', error)
        })
        .finally(() => {
          state.inFlight = false
          if (state.needsRefresh) {
            void refreshSession(designSessionId)
          }
        })
    },
    [],
  )

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
    supabaseRef.current = supabase

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

    const resolveSessionIdForRun = async (
      runId: string,
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

      if (error) {
        console.error('Error resolving session for run event:', error)
        return null
      }

      const designSessionId =
        typeof data?.design_session_id === 'string'
          ? data.design_session_id
          : null

      if (designSessionId) {
        runIdToSessionMap.current.set(runId, designSessionId)
      }

      return designSessionId
    }

    const runsChannel = supabase
      .channel(`run_events_recents_${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'run_events',
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          // Realtime payload is only a trigger; fetch the authoritative status
          // from the run_status view for the affected design session.
          const newRow = extractNewRow(payload)
          if (!newRow) {
            return
          }

          const runId = getStringField(newRow, 'run_id')
          if (!runId) {
            return
          }

          const designSessionId = await resolveSessionIdForRun(runId)
          if (!designSessionId) {
            return
          }

          if (
            !sessionsRef.current.some(
              (session) => session.id === designSessionId,
            )
          ) {
            return
          }

          await refreshSession(designSessionId, runId)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(runsChannel)
      supabaseRef.current = null
    }
  }, [organizationId, refreshSession])

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
                      <Skeleton variant="box" width="80%" height="1rem" />
                      <Skeleton variant="box" width="40%" height="0.75rem" />
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
