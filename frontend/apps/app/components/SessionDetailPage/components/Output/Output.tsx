import type { Schema } from '@liam-hq/schema'
import { type ComponentProps, type FC, useCallback, useState } from 'react'
import { TabsContent, TabsRoot } from '@/components'
import type { ReviewComment } from '../../types'
import { ArtifactContainer } from './components/Artifact/ArtifactContainer'
import { useRealtimeArtifact } from './components/Artifact/hooks/useRealtimeArtifact'
import { formatArtifactToMarkdown } from './components/Artifact/utils/formatArtifactToMarkdown'
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

type BaseProps = ComponentProps<typeof VersionDropdown> & {
  designSessionId: string
  schema: Schema
  prevSchema: Schema
  sqlReviewComments: ReviewComment[]
  initialIsPublic?: boolean
}

type ControlledProps = BaseProps & {
  activeTab: string
  onTabChange: (value: string) => void
}

type UncontrolledProps = BaseProps & {
  activeTab?: never
  onTabChange?: never
}

type Props = ControlledProps | UncontrolledProps

export const Output: FC<Props> = ({
  designSessionId,
  schema,
  prevSchema,
  sqlReviewComments,
  activeTab,
  onTabChange,
  initialIsPublic = false,
  ...propsForVersionDropdown
}) => {
  const [internalTabValue, setInternalTabValue] =
    useState<OutputTabValue>(DEFAULT_OUTPUT_TAB)

  const { artifact, loading, error } = useRealtimeArtifact(designSessionId)

  const isTabValue = (value: string): value is OutputTabValue => {
    return Object.values(OUTPUT_TABS).some((tabValue) => tabValue === value)
  }

  const handleChangeValue = useCallback((value: string) => {
    if (isTabValue(value)) {
      setInternalTabValue(value)
    }
  }, [])

  // Use external control if provided, otherwise use internal state
  const isControlled = activeTab !== undefined
  const tabValue =
    isControlled && isTabValue(activeTab) ? activeTab : internalTabValue
  const handleTabChange = isControlled ? onTabChange : handleChangeValue

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
        hasArtifact={!!artifact}
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
          loading={loading}
          error={error}
        />
      </TabsContent>
    </TabsRoot>
  )
}
