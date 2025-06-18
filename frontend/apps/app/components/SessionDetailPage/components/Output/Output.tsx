import { TabsContent, TabsRoot } from '@/components'
import type { FC } from 'react'
import styles from './Output.module.css'
import { Artifact } from './components/Artifact'
import { ERD } from './components/DBDesign/components/ERD'
import { SchemaUpdates } from './components/DBDesign/components/SchemaUpdates'
import { Header } from './components/Header'
import { DEFAULT_OUTPUT_TAB, OUTPUT_TABS } from './constants'
import { useOutputUI } from './hooks/useOutputUI'
import { OutputUIProvider } from './providers/OutputUIProvider'

type Props = {
  onQuickFix?: (comment: string) => void
}

type OutputContentProps = {
  onQuickFix?: (comment: string) => void
}

const OutputContent: FC<OutputContentProps> = ({ onQuickFix }) => {
  const { state, versionData } = useOutputUI()
  const currentVersionData = versionData[state.selectedVersion]

  // Get previous version's schemaUpdatesDoc
  const versionKeys = Object.keys(versionData)
    .map(Number)
    .sort((a, b) => a - b)
  const currentVersionIndex = versionKeys.indexOf(state.selectedVersion)
  const prevVersionKey =
    currentVersionIndex > 0 ? versionKeys[currentVersionIndex - 1] : null
  const prevSchema =
    prevVersionKey !== null ? versionData[prevVersionKey].schema : undefined
  const prevSchemaUpdatesDoc =
    prevVersionKey !== null
      ? versionData[prevVersionKey].schemaUpdatesDoc
      : undefined

  return (
    <TabsRoot defaultValue={DEFAULT_OUTPUT_TAB} className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <TabsContent value={OUTPUT_TABS.ERD}>
          <div className={styles.section}>
            <ERD schema={currentVersionData.schema} prevSchema={prevSchema} />
          </div>
        </TabsContent>
        <TabsContent value={OUTPUT_TABS.SCHEMA_UPDATES}>
          <div className={styles.section}>
            <SchemaUpdates
              schemaUpdatesDoc={currentVersionData.schemaUpdatesDoc}
              prevSchemaUpdatesDoc={prevSchemaUpdatesDoc}
              comments={currentVersionData.comments}
              onQuickFix={onQuickFix}
            />
          </div>
        </TabsContent>
        <TabsContent value={OUTPUT_TABS.ARTIFACT}>
          <Artifact content={currentVersionData.artifactContent} />
        </TabsContent>
      </div>
    </TabsRoot>
  )
}

export const Output: FC<Props> = ({ onQuickFix }) => {
  return (
    <OutputUIProvider>
      <OutputContent onQuickFix={onQuickFix} />
    </OutputUIProvider>
  )
}
