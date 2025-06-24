'use client'

import type { Schema } from '@liam-hq/db-structure'
import { type ComponentProps, type FC, useCallback, useState } from 'react'
import { parse } from 'valibot'
import { Button } from '@/components'
import { ERDRenderer } from '@/features'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import styles from './ERDEditor.module.css'

type Props = {
  schema: Schema
  errorObjects: ComponentProps<typeof ERDRenderer>['errorObjects']
  defaultSidebarOpen: boolean
  defaultPanelSizes?: number[]
  projectId?: string
  branchOrCommit?: string
}

export const ERDEditor: FC<Props> = ({
  schema,
  errorObjects,
  defaultSidebarOpen,
  defaultPanelSizes = [20, 80],
  projectId,
  branchOrCommit,
}) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')

  // Handler for commit & push button
  const handleCommitAndPush = useCallback(async () => {
    if (!projectId || !branchOrCommit) {
      setUpdateMessage('Repository information is missing.')
      return
    }

    setIsUpdating(true)

    try {
      const res = await fetch('/api/schema/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          branchOrCommit,
        }),
      })

      if (!res.ok) {
        setUpdateMessage('Failed to save group settings.')
      } else {
        setUpdateMessage('Group settings saved successfully.')
      }
    } catch (error) {
      setUpdateMessage(
        `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setIsUpdating(false)
    }
  }, [projectId, branchOrCommit])

  const versionData = {
    version: '0.1.0', // NOTE: no maintained version for ERD Web
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = parse(versionSchema, versionData)

  const canUpdateFile = Boolean(projectId && branchOrCommit)

  return (
    <div className={styles.wrapper}>
      <VersionProvider version={version}>
        <ERDRenderer
          schema={{ current: schema }}
          defaultSidebarOpen={defaultSidebarOpen}
          defaultPanelSizes={defaultPanelSizes}
          errorObjects={errorObjects}
        />
        {canUpdateFile && (
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '8px',
            }}
          >
            {updateMessage && (
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  maxWidth: '300px',
                }}
              >
                {updateMessage}
              </div>
            )}
            <Button onClick={handleCommitAndPush} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Commit & Push'}
            </Button>
          </div>
        )}
      </VersionProvider>
    </div>
  )
}
