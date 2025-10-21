'use client'

import { fromPromise } from '@liam-hq/neverthrow'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { urlgen } from '../../../../libs/routes'
import itemStyles from '../Item.module.css'
import { loadMoreSessions } from './actions'
import { RecentSessionItem } from './RecentSessionItem'
import styles from './RecentsSectionClient.module.css'
import { Skeleton } from './Skeleton'
import type { RecentSession } from './types'

type RecentsSectionClientProps = {
  sessions: RecentSession[]
}

const PAGE_SIZE = 20
const SKELETON_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3']

export const RecentsSectionClient = ({
  sessions: initialSessions,
}: RecentsSectionClientProps) => {
  const pathname = usePathname()
  const [sessions, setSessions] = useState<RecentSession[]>(initialSessions)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialSessions.length >= PAGE_SIZE)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    const result = await fromPromise(
      loadMoreSessions({
        limit: PAGE_SIZE,
        offset: sessions.length,
      }),
    )

    if (result.isErr()) {
      console.error('Error loading more sessions:', result.error)
      setIsLoading(false)
      return
    }

    const newSessions = result.value

    if (newSessions.length === 0) {
      setHasMore(false)
    } else {
      setSessions((prev) => [...prev, ...newSessions])
      setHasMore(newSessions.length >= PAGE_SIZE)
    }

    setIsLoading(false)
  }, [isLoading, hasMore, sessions.length])

  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current

    if (!currentLoadMoreRef) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          loadMore()
        }
      },
      {
        root: null,
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

  return (
    <>
      <div className={clsx(itemStyles.item, styles.recentsCollapsed)}>
        <div className={itemStyles.labelArea}>
          <span className={itemStyles.label}>Recents</span>
        </div>
      </div>
      <div className={styles.recentsExpanded}>
        <div className={styles.recentsSection}>
          <div className={styles.recentsHeader}>
            <div className={itemStyles.labelArea}>
              <span className={clsx(itemStyles.label, styles.recentsTitle)}>
                Recents
              </span>
            </div>
          </div>

          {sessions.length > 0 ? (
            <nav className={styles.sessionsList} aria-label="Recent sessions">
              {sessions.map((session) => {
                const sessionUrl = urlgen('design_sessions/[id]', {
                  id: session.id,
                })
                const isActive = pathname === sessionUrl
                return (
                  <RecentSessionItem
                    key={session.id}
                    session={session}
                    isActive={isActive}
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
