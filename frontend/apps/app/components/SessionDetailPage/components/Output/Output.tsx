'use client'

import type { AnalyzedRequirements } from '@liam-hq/agent/client'
import type { Schema } from '@liam-hq/schema'
import { TabsContent, TabsRoot } from '@liam-hq/ui'
import { type ComponentProps, type FC, useCallback, useState } from 'react'
import { ArtifactContainer } from './components/Artifact/ArtifactContainer'
import { ERD } from './components/ERD'
import { Header } from './components/Header'
import type { VersionDropdown } from './components/Header/VersionDropdown'
import { Migrations } from './components/Migrations'
import {
  DEFAULT_OUTPUT_TAB,
  OUTPUT_TABS,
  type OutputTabValue,
} from './constants'
import styles from './Output.module.css'

type Props = ComponentProps<typeof VersionDropdown> & {
  designSessionId: string
  schema: Schema
  baselineSchema: Schema
  initialIsPublic: boolean
  activeTab: OutputTabValue
  onTabChange: (value: OutputTabValue) => void
  analyzedRequirements?: AnalyzedRequirements | null
}

export const Output: FC<Props> = ({
  designSessionId,
  schema,
  baselineSchema,
  activeTab,
  onTabChange,
  initialIsPublic = false,
  analyzedRequirements,
  ...propsForVersionDropdown
}) => {
  const [internalTabValue, setInternalTabValue] =
    useState<OutputTabValue>(DEFAULT_OUTPUT_TAB)

  const isTabValue = useCallback((value: string): value is OutputTabValue => {
    return Object.values(OUTPUT_TABS).some((tabValue) => tabValue === value)
  }, [])

  const handleChangeValue = useCallback(
    (value: string) => {
      if (isTabValue(value)) {
        setInternalTabValue(value)
      }
    },
    [isTabValue],
  )

  // Use external control if provided, otherwise use internal state
  const isControlled = activeTab !== undefined
  const tabValue = isControlled ? activeTab : internalTabValue
  const handleTabChange = isControlled
    ? (value: string) => {
        if (isTabValue(value)) {
          onTabChange(value)
        }
      }
    : handleChangeValue

  return (
    <TabsRoot
      value={tabValue}
      className={styles.tabsRoot}
      onValueChange={handleTabChange}
    >
      <Header
        schema={schema}
        tabValue={tabValue}
        analyzedRequirements={analyzedRequirements}
        designSessionId={designSessionId}
        initialIsPublic={initialIsPublic}
        {...propsForVersionDropdown}
      />
      <TabsContent
        value={OUTPUT_TABS.ERD}
        className={styles.tabsContent}
        forceMount
      >
        <ERD schema={schema} baselineSchema={baselineSchema} />
      </TabsContent>
      <TabsContent
        value={OUTPUT_TABS.MIGRATIONS}
        className={styles.tabsContent}
        forceMount
      >
        <Migrations baselineSchema={baselineSchema} schema={schema} />
      </TabsContent>
      <TabsContent
        value={OUTPUT_TABS.ARTIFACT}
        className={styles.tabsContent}
        forceMount
      >
        <ArtifactContainer analyzedRequirements={analyzedRequirements} />
      </TabsContent>
    </TabsRoot>
  )
}
