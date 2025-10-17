'use client'

import { fromPromise } from '@liam-hq/neverthrow'
import {
  ChevronsUpDown,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Users,
} from '@liam-hq/ui'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { urlgen } from '../../../../libs/routes'
import { formatDateShort } from '../../../../libs/utils'
import itemStyles from '../Item.module.css'
import { fetchFilteredSessions, loadMoreSessions } from './actions'
import styles from './RecentsSectionClient.module.css'
import { Skeleton } from './Skeleton'
import type { RecentSession, SessionFilterType } from './types'

type OrganizationMember = {
  id: string
  name: string
  email: string
}

type RecentsSectionClientProps = {
  sessions: RecentSession[]
  organizationMembers: OrganizationMember[]
  currentUserId: string
}

const PAGE_SIZE = 20
const SKELETON_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3']

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

  const handleFilterChange = useCallback(async (newFilterType: string) => {
    setFilterType(newFilterType)
    setIsLoading(true)

    const result = await fromPromise(fetchFilteredSessions(newFilterType))

    if (result.isErr()) {
      console.error('Error fetching filtered sessions:', result.error)
      setIsLoading(false)
      return
    }

    const newSessions = result.value
    setSessions(newSessions)
    setHasMore(newSessions.length >= PAGE_SIZE)
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
  }, [isLoading, hasMore, sessions.length, filterType])

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

  const getFilterLabel = (filter: SessionFilterType) => {
    if (filter === 'all') return 'All Sessions'
    if (filter === 'me') return 'My Sessions'
    const member = organizationMembers.find((m) => m.id === filter)
    return member ? member.name : 'Unknown User'
  }

  return (
    <>
      <div className={clsx(itemStyles.item, styles.recentsCollapsed)}>
        <div className={itemStyles.labelArea}>
          <span className={itemStyles.label}>Recents</span>
        </div>
      </div>
      <div className={styles.recentsExpanded}>
        <div className={styles.recentsSection}>
          <DropdownMenuRoot>
            <DropdownMenuTrigger>
              <div className={clsx(itemStyles.item, styles.filterItem)}>
                <div className={itemStyles.iconContainer}>
                  <Users />
                </div>
                <div className={itemStyles.labelArea}>
                  <span className={itemStyles.label}>
                    {getFilterLabel(filterType)}
                  </span>
                  <ChevronsUpDown className={styles.chevronIcon} />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className={styles.dropdownContent}
            >
              <DropdownMenuRadioGroup
                value={filterType}
                onValueChange={handleFilterChange}
              >
                <DropdownMenuRadioItem value="me" label="My Sessions" />
                <DropdownMenuRadioItem value="all" label="All Sessions" />
                {organizationMembers.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    {organizationMembers
                      .filter((member) => member.id !== currentUserId)
                      .map((member) => (
                        <DropdownMenuRadioItem
                          key={member.id}
                          value={member.id}
                          label={member.name}
                        />
                      ))}
                  </>
                )}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenuRoot>

          {sessions.length > 0 ? (
            <nav className={styles.sessionsList} aria-label="Recent sessions">
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
