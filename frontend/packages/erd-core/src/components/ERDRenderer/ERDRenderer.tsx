import '@xyflow/react/dist/style.css'
import {
  SidebarProvider,
  SidebarTrigger,
  getSidebarStateFromCookie,
} from '@liam-hq/ui'
import { ReactFlowProvider } from '@xyflow/react'
import type { FC } from 'react'
import { ERDContent } from './ERDContent'
import styles from './ERDRenderer.module.css'
import { LeftPane } from './LeftPane'

export const ERDRenderer: FC = () => {
  const defaultOpen = getSidebarStateFromCookie()

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className={styles.wrapper}>
        <LeftPane />
        <main className={styles.main}>
          <div className={styles.triggerWrapper}>
            <SidebarTrigger />
          </div>
          <ReactFlowProvider>
            <ERDContent />
          </ReactFlowProvider>
        </main>
      </div>
    </SidebarProvider>
  )
}
