'use client'

import type { AnalyzedRequirements, Artifact } from '@liam-hq/artifact'
import type { Schema } from '@liam-hq/schema'
import { TabsContent, TabsRoot } from '@liam-hq/ui'
import { type ComponentProps, type FC, useCallback, useState } from 'react'
import type { ReviewComment } from '../../types'
import { ArtifactContainer } from './components/Artifact/ArtifactContainer'
import { formatArtifactToMarkdown } from './components/Artifact/utils'
import { ERD } from './components/ERD'
import { Header } from './components/Header'
import type { VersionDropdown } from './components/Header/VersionDropdown'
import { SQL } from './components/SQL'
import {
  DEFAULT_OUTPUT_TAB,
  OUTPUT_TABS,
  type OutputTabValue,
} from './constants'
import styles from './Output.module.css'

type Props = ComponentProps<typeof VersionDropdown> & {
  designSessionId: string
  schema: Schema
  prevSchema: Schema
  sqlReviewComments: ReviewComment[]
  initialIsPublic: boolean
  activeTab: OutputTabValue
  onTabChange: (value: OutputTabValue) => void
  artifact: Artifact | null
  artifactError: Error | null
  analyzedRequirements?: AnalyzedRequirements | null
}

export const Output: FC<Props> = ({
  designSessionId,
  schema,
  prevSchema,
  sqlReviewComments,
  activeTab,
  onTabChange,
  initialIsPublic = false,
  artifact,
  artifactError,
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

  // Convert artifact data to markdown format
  const artifactDoc = artifact ? formatArtifactToMarkdown(artifact) : undefined

  return (
    <TabsRoot
      value={tabValue}
      className={styles.tabsRoot}
      onValueChange={handleTabChange}
    >
      <Header
        schema={schema}
        tabValue={tabValue}
        artifactDoc={artifactDoc}
        designSessionId={designSessionId}
        initialIsPublic={initialIsPublic}
        {...propsForVersionDropdown}
      />
      <TabsContent value={OUTPUT_TABS.ERD} className={styles.tabsContent}>
        <ERD schema={schema} prevSchema={prevSchema} />
      </TabsContent>
      <TabsContent value={OUTPUT_TABS.SQL} className={styles.tabsContent}>
        <SQL
          currentSchema={schema}
          prevSchema={prevSchema}
          comments={sqlReviewComments}
        />
      </TabsContent>
      <TabsContent value={OUTPUT_TABS.ARTIFACT} className={styles.tabsContent}>
        <ArtifactContainer
          artifact={artifact}
          error={artifactError}
          analyzedRequirements={analyzedRequirements}
        />
      </TabsContent>
    </TabsRoot>
  )
}
