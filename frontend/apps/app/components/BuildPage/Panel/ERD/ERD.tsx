'use client'

import { SwitchRoot, SwitchThumb } from '@/components'
import { ERDRenderer } from '@/features'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import { initSchemaStore } from '@/stores'
import { type Schema, buildSchemaDiff } from '@liam-hq/db-structure'
import { type FC, useCallback, useEffect, useState } from 'react'
import { parse } from 'valibot'
import styles from './ERD.module.css'

export type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

type Props = {
  currentSchema: Schema
  previousSchema?: Schema
  errors: ErrorObject[]
}

export const ERD: FC<Props> = ({ currentSchema, previousSchema, errors }) => {
  const [isDiffView, setIsDiffView] = useState(true)

  const versionData = {
    version: '0.1.0',
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = parse(versionSchema, versionData)

  const handleChangeChecked = useCallback((value: boolean) => {
    setIsDiffView(value)
  }, [])

  useEffect(() => {
    if (previousSchema === undefined) {
      initSchemaStore({
        current: currentSchema,
        previous: undefined,
        diffItems: [],
      })
      return
    }

    const diffItems = buildSchemaDiff(previousSchema, currentSchema)
    initSchemaStore({
      current: currentSchema,
      previous: previousSchema,
      diffItems,
    })
  }, [currentSchema, previousSchema])

  return (
    <div className={styles.wrapper}>
      <div className={styles.switchWrapper}>
        <label
          className={styles.switchLabel}
          htmlFor="diff-mode"
          style={{ paddingRight: 15 }}
        >
          Diff mode
        </label>
        <SwitchRoot
          className={styles.switchRoot}
          id="diff-mode"
          checked={isDiffView}
          onCheckedChange={handleChangeChecked}
        >
          <SwitchThumb className={styles.switchThumb} />
        </SwitchRoot>
      </div>
      <div className={styles.erdSection}>
        <VersionProvider version={version}>
          <ERDRenderer
            isDiffView={isDiffView}
            defaultSidebarOpen={false}
            defaultPanelSizes={[20, 80]}
            errorObjects={errors}
          />
        </VersionProvider>
      </div>
    </div>
  )
}
