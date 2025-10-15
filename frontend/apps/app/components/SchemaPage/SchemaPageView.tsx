import { TabsContent, TabsRoot } from '@liam-hq/ui'
import type { ComponentProps } from 'react'
import type { FormatType } from '../FormatIcon'
import { ERDEditor } from './components/ERDEditor'
import { SchemaHeader } from './components/SchemaHeader'
import { DEFAULT_SCHEMA_TAB, SCHEMA_TAB } from './constants'
import styles from './SchemaPage.module.css'

type ERDEditorProps = ComponentProps<typeof ERDEditor>

type SchemaHeaderData = {
  schemaName: string
  format: FormatType
  href: string
} | null

type Props = {
  erdEditorProps: ERDEditorProps
  schemaHeader: SchemaHeaderData
}

export const SchemaPageView = ({ erdEditorProps, schemaHeader }: Props) => {
  return (
    <TabsRoot defaultValue={DEFAULT_SCHEMA_TAB} className={styles.wrapper}>
      {schemaHeader ? (
        <SchemaHeader
          schemaName={schemaHeader.schemaName}
          format={schemaHeader.format}
          href={schemaHeader.href}
        />
      ) : null}
      <TabsContent value={SCHEMA_TAB.ERD} className={styles.tabsContent}>
        <ERDEditor {...erdEditorProps} />
      </TabsContent>
    </TabsRoot>
  )
}
