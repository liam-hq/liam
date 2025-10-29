import type { AnalyzedRequirements } from '@liam-hq/agent/client'
import type { Schema } from '@liam-hq/schema'
import {
  type MigrationOperation,
  migrationOperationsSchema,
} from '@liam-hq/schema'
import { TabsList, TabsTrigger } from '@liam-hq/ui'
import clsx from 'clsx'
import type { ComponentProps, FC } from 'react'
import * as v from 'valibot'
import type { Version } from '../../../../types'
import {
  ARTIFACT_TAB,
  ERD_SCHEMA_TABS_LIST,
  type OutputTabValue,
} from '../../constants'
import { formatArtifactToMarkdown } from '../Artifact/utils'
import { ExportDropdown } from './ExportDropdown'
import styles from './Header.module.css'
import { ShareButton } from './ShareButton'
import { VersionDropdown } from './VersionDropdown'

// Phase 6.4: artifactDoc replaced with analyzedRequirements
type Props = ComponentProps<typeof VersionDropdown> & {
  schema: Schema
  tabValue: OutputTabValue
  analyzedRequirements?: AnalyzedRequirements | null
  designSessionId: string
  initialIsPublic: boolean
}

const generateCumulativeOperations = (
  versions: Version[] | undefined,
  selectedVersion: Version | null,
): MigrationOperation[] => {
  if (!selectedVersion) return []

  const versionsUpToSelected = (versions ?? [])
    .filter((v) => v.number <= selectedVersion.number)
    .sort((a, b) => a.number - b.number)

  const operations: MigrationOperation[] = []

  for (const version of versionsUpToSelected) {
    const parsed = v.safeParse(migrationOperationsSchema, version.patch)
    if (parsed.success) {
      operations.push(...parsed.output)
    }
  }

  return operations
}

export const Header: FC<Props> = ({
  schema,
  tabValue,
  analyzedRequirements,
  designSessionId,
  initialIsPublic,
  ...propsForVersionDropdown
}) => {
  const { versions, selectedVersion } = propsForVersionDropdown
  const disabled = !versions || versions.length === 0 || !selectedVersion
  const cumulativeOperations = generateCumulativeOperations(
    versions,
    selectedVersion,
  )

  // Phase 6.4: Convert analyzedRequirements to markdown
  const artifactDoc = analyzedRequirements
    ? formatArtifactToMarkdown(analyzedRequirements)
    : undefined

  return (
    <div className={styles.wrapper}>
      <TabsList className={styles.tabsList}>
        <div
          className={clsx(styles.tab, styles.erdSchemaTabsGroup)}
          aria-disabled={disabled}
          data-state={
            ERD_SCHEMA_TABS_LIST.some((tab) => tab.value === tabValue)
              ? 'active'
              : 'inactive'
          }
        >
          <div className={styles.erdSchemaTabs}>
            {ERD_SCHEMA_TABS_LIST.map((tab) => (
              <TabsTrigger
                disabled={disabled}
                key={tab.value}
                value={tab.value}
                className={styles.erdSchemaTrigger}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </div>
          <div className={styles.divider} />
          <VersionDropdown {...propsForVersionDropdown} />
        </div>
        <TabsTrigger
          disabled={!artifactDoc}
          value={ARTIFACT_TAB.value}
          className={clsx(styles.tab, styles.artifactTrigger)}
        >
          {ARTIFACT_TAB.label}
        </TabsTrigger>
      </TabsList>
      <div className={styles.tail}>
        <ExportDropdown
          disabled={disabled}
          schema={schema}
          artifactDoc={artifactDoc}
          cumulativeOperations={cumulativeOperations}
        />
        <ShareButton
          designSessionId={designSessionId}
          initialIsPublic={initialIsPublic}
        />
      </div>
    </div>
  )
}
