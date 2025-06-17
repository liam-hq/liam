import { TabsContent, TabsRoot } from '@/components'
import type { FC } from 'react'
import styles from './Output.module.css'
import { Artifact } from './components/Artifact'
import { DBDesign } from './components/DBDesign'
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

  return (
    <TabsRoot defaultValue={DEFAULT_OUTPUT_TAB} className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <TabsContent value={OUTPUT_TABS.DB_DESIGN}>
          <DBDesign
            schema={currentVersionData.schema}
            schemaUpdatesDoc={currentVersionData.schemaUpdatesDoc}
            comments={currentVersionData.comments}
            onQuickFix={onQuickFix}
          />
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
