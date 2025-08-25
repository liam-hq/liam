import type { Schema } from '@liam-hq/schema'
import { type Operation, operationsSchema } from '@liam-hq/schema'
import { TabsList, TabsTrigger } from '@liam-hq/ui'
import clsx from 'clsx'
import type { ComponentProps, FC } from 'react'
import * as v from 'valibot'
import type { Version } from '@/components/SessionDetailPage/types'
import {
  ARTIFACT_TAB,
  ERD_SCHEMA_TABS_LIST,
  type OutputTabValue,
} from '../../constants'
import { ExportDropdown } from './ExportDropdown'
import styles from './Header.module.css'
import { ShareButton } from './ShareButton'
import { VersionDropdown } from './VersionDropdown'

type Props = ComponentProps<typeof VersionDropdown> & {
  schema: Schema
  tabValue: OutputTabValue
  artifactDoc?: string
  hasArtifact?: boolean
  designSessionId: string
  initialIsPublic: boolean
}

const generateCumulativeOperations = (
  versions: Version[],
  selectedVersion: Version | null,
): Operation[] => {
  if (!selectedVersion) return []

  const versionsUpToSelected = versions
    .filter((v) => v.number <= selectedVersion.number)
    .sort((a, b) => a.number - b.number)

  const operations: Operation[] = []

  for (const version of versionsUpToSelected) {
    const parsed = v.safeParse(operationsSchema, version.patch)
    if (parsed.success) {
      operations.push(...parsed.output)
    }
  }

  return operations
}

export const Header: FC<Props> = ({
  schema,
  tabValue,
  artifactDoc,
  hasArtifact,
  designSessionId,
  initialIsPublic,
  ...propsForVersionDropdown
}) => {
  const { versions, selectedVersion } = propsForVersionDropdown

  // Generate cumulative operations
  const cumulativeOperations = generateCumulativeOperations(
    versions,
    selectedVersion,
  )

  return (
    <div className={styles.wrapper}>
      <TabsList className={styles.tabsList}>
        <div
          className={clsx(styles.tab, styles.erdSchemaTabsGroup)}
          data-state={
            ERD_SCHEMA_TABS_LIST.some((tab) => tab.value === tabValue)
              ? 'active'
              : 'inactive'
          }
        >
          <div className={styles.erdSchemaTabs}>
            {ERD_SCHEMA_TABS_LIST.map((tab) => (
              <TabsTrigger
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
        {hasArtifact && (
          <TabsTrigger
            value={ARTIFACT_TAB.value}
            className={clsx(styles.tab, styles.artifactTrigger)}
          >
            {ARTIFACT_TAB.label}
          </TabsTrigger>
        )}
      </TabsList>
      <div className={styles.tail}>
        <ExportDropdown
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
