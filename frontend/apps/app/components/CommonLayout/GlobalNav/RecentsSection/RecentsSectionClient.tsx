'use client'

import { fromPromise } from '@liam-hq/neverthrow'
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
}

const PAGE_SIZE = 20
const SKELETON_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3']

const mapRealtimeStatus = (
  status: unknown,
): RecentSession['status'] | null => {
  if (status === 'running') {
    return 'running'
  }

  if (status === 'error') {
    return 'error'
  }

  if (status === 'completed') {
    return 'completed'
  }

  return null
}

export const RecentsSectionClient = ({
  sessions: initialSessions,
  organizationMembers,
  currentUserId,
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
  }, [filterType, hasMore, isLoading, sessions.length])

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
    const ids = sessions.map((session) => session.id)
    if (ids.length === 0) return

    const supabase = createSupabaseClient()
    const filter = `id=in.(${ids.join(',')})`
    const channel = supabase
      .channel('design_sessions_status_recents')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'design_sessions',
          filter,
        },
        (payload) => {
          if (!payload.new || typeof payload.new !== 'object') {
            return
          }

          const idValue = Reflect.get(payload.new, 'id')
          if (typeof idValue !== 'string') {
            return
          }

          const rawStatus = Reflect.get(payload.new, 'status')
          const nextStatus = mapRealtimeStatus(rawStatus)

          setSessions((prev) =>
            prev.map((session) =>
              session.id === idValue
                ? {
                    ...session,
                    status: nextStatus ?? session.status,
                  }
                : session,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessions])

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
