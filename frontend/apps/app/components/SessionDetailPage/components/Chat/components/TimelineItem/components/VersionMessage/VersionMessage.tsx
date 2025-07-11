'use client'

import type { Json, Tables } from '@liam-hq/db'
import { operationsSchema } from '@liam-hq/db-structure'
import { Check, ChevronDown } from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useEffect, useState, useTransition } from 'react'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'
import styles from './VersionMessage.module.css'

/**
 * Parse JSON patch operations into structured format
 */
const parsePatchOperations = (
  patch: Json,
): Array<{ path: string; op: string; status: string }> => {
  const operations = v.parse(operationsSchema, patch)

  return operations.map((operation) => {
    const path = operation.path.replace(/^\//, '').replace(/\//g, ' → ')

    let status: string
    switch (operation.op) {
      case 'add':
        status = 'Added'
        break
      case 'remove':
        status = 'Removed'
        break
      case 'replace':
        status = 'Modified'
        break
      case 'move':
        status = 'Moved'
        break
      case 'copy':
        status = 'Copied'
        break
      case 'test':
        status = 'Tested'
        break
      default:
        status = 'Unknown'
        break
    }

    return {
      path,
      op: operation.op,
      status,
    }
  })
}

type BuildingSchemaVersion = Pick<
  Tables<'building_schema_versions'>,
  'patch' | 'number' | 'id'
>

type Props = {
  buildingSchemaVersionId: string
}

export const VersionMessage: FC<Props> = ({ buildingSchemaVersionId }) => {
  const [version, setVersion] = useState<BuildingSchemaVersion | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('building_schema_versions')
        .select('id, number, patch')
        .eq('id', buildingSchemaVersionId)
        .single()

      if (error) {
        console.error('Failed to fetch version:', error)
        return
      }

      if (data) {
        setVersion(data)
      }
    })
  }, [buildingSchemaVersionId])

  if (isPending || !version) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.chevron}>
            <ChevronDown />
          </div>
          <span className={styles.versionNumber}>Loading version...</span>
        </div>
      </div>
    )
  }

  const displayVersionNumber = version.number
  const patchOperations = parsePatchOperations(version.patch)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={styles.container}>
      <button type="button" className={styles.header} onClick={toggleExpanded}>
        <div
          className={clsx(styles.chevron, isExpanded ? styles.expanded : '')}
        >
          <ChevronDown />
        </div>
        <span className={styles.versionNumber}>
          Version {displayVersionNumber}
        </span>
      </button>

      <div className={clsx(styles.content, isExpanded ? styles.expanded : '')}>
        <div className={styles.operationList}>
          {patchOperations.map((operation, index) => (
            <div
              key={`${version.id}-${index}`}
              className={styles.operationItem}
            >
              <span className={styles.operationName}>{operation.path}</span>
              <span className={styles.operationStatus}>{operation.status}</span>
            </div>
          ))}
          {patchOperations.length === 0 && (
            <div className={styles.operationItem}>
              <div className={styles.operationIcon}>
                <Check />
              </div>
              <span className={styles.operationName}>Schema updated</span>
              <span className={styles.operationStatus}>Generated</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
