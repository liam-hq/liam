'use client'

import { fromPromise } from '@liam-hq/neverthrow'
import * as Sentry from '@sentry/nextjs'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '../../../../libs/db/client'
import { urlgen } from '../../../../libs/routes'
import { formatDateShort } from '../../../../libs/utils'
import itemStyles from '../Item.module.css'
import { fetchFilteredSessions, loadMoreSessions } from './actions'
import {
  type OrganizationMember,
  SessionFilterDropdown,
} from './components/SessionFilterDropdown'
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

  const handleFilterChange = useCallback(async (newFilterType: string) => {
    setFilterType(newFilterType)
    setIsLoading(true)

    const result = await fromPromise(fetchFilteredSessions(newFilterType))

    result.match(
      (newSessions) => {
        setSessions(newSessions)
        setHasMore(newSessions.length >= PAGE_SIZE)
      },
      (err) => {
        Sentry.captureException(err)
      },
    )

    setIsLoading(false)
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    const result = await fromPromise(
      loadMoreSessions({
        limit: PAGE_SIZE,
        offset: sessions.length,
        filterType,
      }),
    )

    result.match(
      (newSessions) => {
        if (newSessions.length === 0) {
          setHasMore(false)
        } else {
          setSessions((prev) => [...prev, ...newSessions])
          setHasMore(newSessions.length >= PAGE_SIZE)
        }
      },
      (err) => {
        Sentry.captureException(err)
      },
    )

    setIsLoading(false)
  }, [isLoading, hasMore, sessions.length, filterType])

  const handleInsertEvent = useCallback(
    async (supabase: ReturnType<typeof createClient>, sessionId: string) => {
      const { data: newSession, error } = await supabase
        .from('design_sessions')
        .select(
          `
          id,
          name,
          created_at,
          project_id,
          created_by_user:created_by_user_id(
            id,
            name,
            email,
            avatar_url
          )
        `,
        )
        .eq('id', sessionId)
        .single()

      if (error || !newSession) {
        console.error('Error fetching new session:', error)
        return
      }

      const shouldDisplay =
        filterType === 'all' ||
        (filterType === 'me' &&
          newSession.created_by_user?.id === currentUserId) ||
        (filterType !== 'all' &&
          filterType !== 'me' &&
          newSession.created_by_user?.id === filterType)

      if (!shouldDisplay) {
        return
      }

      setSessions((prevSessions) => {
        const exists = prevSessions.some((s) => s.id === newSession.id)
        if (exists) {
          return prevSessions
        }
        return [newSession, ...prevSessions]
      })
    },
    [filterType, currentUserId],
  )

  const handleUpdateEvent = useCallback((sessionId: string, name: string) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, name } : session,
      ),
    )
  }, [])

  const handleDeleteEvent = useCallback((sessionId: string) => {
    setSessions((prevSessions) =>
      prevSessions.filter((session) => session.id !== sessionId),
    )
  }, [])

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
    const supabase = createClient()

    const channel = supabase
      .channel(`design_sessions:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'design_sessions',
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              await handleInsertEvent(supabase, payload.new.id)
            } else if (payload.eventType === 'UPDATE') {
              handleUpdateEvent(payload.new.id, payload.new.name)
            } else if (payload.eventType === 'DELETE') {
              handleDeleteEvent(payload.old.id)
            }
          } catch (error) {
            console.error('Error handling realtime event:', error)
            Sentry.captureException(error)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, handleInsertEvent, handleUpdateEvent, handleDeleteEvent])

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
                const sessionDate = formatDateShort(session.created_at)
                const showOwner = filterType !== 'me'
                const ownerName = session.created_by_user?.name || 'Unknown'

                return (
                  <Link
                    key={session.id}
                    href={sessionUrl}
                    className={clsx(
                      styles.sessionItem,
                      isActive && styles.sessionItemActive,
                    )}
                    aria-label={`${session.name}, created on ${sessionDate}${showOwner ? ` by ${ownerName}` : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionName}>{session.name}</span>
                      {showOwner && (
                        <span className={styles.sessionOwner}>{ownerName}</span>
                      )}
                    </div>
                    <span className={styles.sessionDate} aria-hidden="true">
                      {sessionDate}
                    </span>
                  </Link>
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
