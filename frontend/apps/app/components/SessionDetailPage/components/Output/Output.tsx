import type { Artifact } from '@liam-hq/artifact'
import type { Schema } from '@liam-hq/schema'
import { type ComponentProps, type FC, useCallback, useState } from 'react'
import { TabsContent, TabsRoot } from '@/components'
import type { ReviewComment } from '../../types'
import { ArtifactContainer } from './components/Artifact/ArtifactContainer'
import { usePublicRealtimeArtifact } from './components/Artifact/hooks/usePublicRealtimeArtifact'
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
  isPublicView?: boolean
  initialArtifact?: Artifact | null
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
  isPublicView = false,
  initialArtifact = null,
  ...propsForVersionDropdown
}) => {
  const [internalTabValue, setInternalTabValue] =
    useState<OutputTabValue>(DEFAULT_OUTPUT_TAB)

  const publicArtifactResult = usePublicRealtimeArtifact(
    designSessionId,
    initialArtifact,
  )
  const privateArtifactResult = useRealtimeArtifact(designSessionId)
  const { artifact, loading, error } = isPublicView
    ? publicArtifactResult
    : privateArtifactResult

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
