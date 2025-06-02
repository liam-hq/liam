'use client'

import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components'
import { Chat } from '@/components/Chat'
import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { BRDContent } from './BRDContent'
import { DBDesignContent } from './DBDesignContent'
import styles from './Panel.module.css'
import { Team } from './Team'
import { TAB_CONFIGS, TAB_VALUES } from './constants'

type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

type Props = {
  schema: Schema
  errors: ErrorObject[]
  projectId: string
}

export const Panel: FC<Props> = ({ schema, errors, projectId }) => {
  return (
    <div className={styles.container}>
      <div className={styles.columns}>
        <div className={styles.chatSection}>
          <Chat schemaData={schema} projectId={projectId} />
        </div>

        <TabsRoot
          defaultValue={TAB_VALUES.DB_DESIGN}
          className={styles.tabsRoot}
        >
          <TabsList className={styles.tabsList}>
            {TAB_CONFIGS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className={styles.button}>
                <TooltipProvider>
                  <TooltipRoot>
                    <TooltipTrigger asChild>
                      <Icon />
                    </TooltipTrigger>
                    <TooltipPortal>
                      <TooltipContent side="left" sideOffset={4}>
                        {label}
                      </TooltipContent>
                    </TooltipPortal>
                  </TooltipRoot>
                </TooltipProvider>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className={styles.teamAndPreview}>
            <Team />
            <div className={styles.preview}>
              <TabsContent
                value={TAB_VALUES.DB_DESIGN}
                className={styles.tabsContent}
              >
                <DBDesignContent schema={schema} errors={errors} />
              </TabsContent>
              <TabsContent
                value={TAB_VALUES.BRD}
                className={styles.tabsContent}
              >
                <BRDContent />
              </TabsContent>
              <TabsContent value={TAB_VALUES.QA} className={styles.tabsContent}>
                QA
              </TabsContent>
              <TabsContent value={TAB_VALUES.QE} className={styles.tabsContent}>
                Query Executor
              </TabsContent>
            </div>
          </div>
        </TabsRoot>
      </div>
    </div>
  )
}
