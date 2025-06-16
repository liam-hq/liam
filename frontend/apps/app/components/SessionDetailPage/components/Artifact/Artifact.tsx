import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components'
import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import styles from './Artifact.module.css'
import { BRDList } from './components/BRDList'
import { ERD } from './components/ERD'
import { Header } from './components/Header'
import { MigrationsViewer } from './components/MigrationsViewer'
import { BRD_LIST, MIGRATIONS_DOC, REVIEW_COMMENTS } from './mock'

type Props = {
  schema: Schema
}

export const Artifact: FC<Props> = ({ schema }) => {
  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <TabsRoot defaultValue="erd" className={styles.tabsRoot}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="erd" className={styles.tabsTrigger}>
              ERD
            </TabsTrigger>
            <TabsTrigger value="migrations" className={styles.tabsTrigger}>
              Migrations
            </TabsTrigger>
          </TabsList>
          <TabsContent value="erd" className={styles.tabsContent}>
            <ERD schema={schema} />
          </TabsContent>
          <TabsContent value="migrations" className={styles.tabsContent}>
            <MigrationsViewer
              doc={MIGRATIONS_DOC}
              reviewComments={REVIEW_COMMENTS}
            />
          </TabsContent>
        </TabsRoot>
        <BRDList items={BRD_LIST} />
      </div>
    </div>
  )
}
