'use client'

import type { Tables } from '@liam-hq/db'
import { operationsSchema } from '@liam-hq/schema'
import {
  ArrowRight,
  Button,
  Check,
  ChevronDown,
  ChevronRight,
} from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, Fragment, useCallback, useState } from 'react'
import * as v from 'valibot'
import styles from './VersionMessage.module.css'

/**
 * Parse JSON patch operations into structured format
 */
type StatusClass =
  | 'statusAdded'
  | 'statusRemoved'
  | 'statusModified'
  | 'statusUnknown'

const parsePatchOperations = (
  patch: Tables<'building_schema_versions'>['patch'],
): Array<{
  path: string[]
  op: string
  status: string
  statusClass: StatusClass
}> => {
  const result = v.safeParse(operationsSchema, patch)

  if (!result.success) {
    console.error('Failed to parse patch operations:', result.issues)
    return []
  }

  const operations = result.output

  return operations.map((operation) => {
    const pathParts = operation.path.replace(/^\//, '').split('/')

    let status: string
    let statusClass: StatusClass
    switch (operation.op) {
      case 'add':
        status = 'Added'
        statusClass = 'statusAdded'
        break
      case 'remove':
        status = 'Removed'
        statusClass = 'statusRemoved'
        break
      case 'replace':
        status = 'Modified'
        statusClass = 'statusModified'
        break
      default:
        status = 'Unknown'
        statusClass = 'statusUnknown'
        break
    }

    return {
      path: pathParts,
      op: operation.op,
      status,
      statusClass,
    }
  })
}

type Props = {
  version: {
    id: string
    number: number
    patch: Tables<'building_schema_versions'>['patch']
  } | null
  // eslint-disable-next-line no-restricted-syntax
  onView?: (versionId: string) => void
}

export const VersionMessage: FC<Props> = ({ version, onView }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const currentVersion = version

  const handleClick = useCallback(() => {
    if (!currentVersion) return
    onView?.(currentVersion.id)
  }, [currentVersion, onView])

  if (!currentVersion) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.headerButton}
            disabled
            aria-label="Version information loading"
            aria-expanded={false}
          >
            <div className={styles.collapseButton}>
              <ChevronRight />
            </div>
            <span className={styles.versionNumber}>
              Version information loading...
            </span>
          </button>
        </div>
      </div>
    )
  }

  const displayVersionNumber = currentVersion.number
  const patchOperations = parsePatchOperations(currentVersion.patch)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={clsx(styles.container, isExpanded && styles.expanded)}>
      <div className={clsx(styles.header, isExpanded && styles.expanded)}>
        <button
          type="button"
          className={styles.headerButton}
          onClick={toggleExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} version ${displayVersionNumber} details`}
          aria-expanded={isExpanded}
          id={`version-header-${currentVersion?.id}`}
        >
          <div className={styles.collapseButton}>
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
          </div>
          <span className={styles.versionNumber}>
            Version {displayVersionNumber}
          </span>
        </button>
        {onView && (
          <Button
            variant="outline-secondary"
            size="xs"
            onClick={handleClick}
            className={styles.viewButton}
          >
            View
          </Button>
        )}
      </div>

      <div className={styles.divider} />
      <section
        className={clsx(styles.contentWrapper, isExpanded && styles.expanded)}
        aria-labelledby={`version-header-${currentVersion?.id}`}
      >
        <div className={styles.content}>
          {patchOperations.map((operation, index) => (
            <div
              key={`${currentVersion.id}-${index}`}
              className={clsx(
                styles.operationItem,
                styles[operation.statusClass],
              )}
            >
              <div className={styles.pathContainer}>
                {operation.path.map((part, partIndex) => (
                  <Fragment key={`${currentVersion.id}-${partIndex}`}>
                    {partIndex > 0 && (
                      <div className={styles.arrowContainer}>
                        <ArrowRight />
                      </div>
                    )}
                    <span className={styles.pathPart}>{part}</span>
                  </Fragment>
                ))}
              </div>
              <span
                className={clsx(
                  styles.operationStatus,
                  styles[operation.statusClass],
                )}
              >
                {operation.status}
              </span>
            </div>
          ))}
          {patchOperations.length === 0 && (
            <div className={clsx(styles.operationItem, styles.statusGenerated)}>
              <div className={styles.pathContainer}>
                <div className={styles.generatedIcon}>
                  <Check />
                </div>
                <span className={styles.pathPart}>Schema updated</span>
              </div>
              <span
                className={clsx(styles.operationStatus, styles.statusGenerated)}
              >
                Generated
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
