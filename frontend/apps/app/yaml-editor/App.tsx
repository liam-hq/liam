'use client'

import { Toaster } from '@/components/ui/toaster'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { VersionList } from './VersionList'
import { YamlEditor } from './YamlEditor'
import styles from './YamlEditor.module.css'
import { useSchemaVersionStore } from './schemaVersionStore'

export default function App() {
  const { initializeStore } = useSchemaVersionStore()
  const { theme } = useTheme()


  return (
    <div className={styles.containerInContent} data-theme={theme}>
      <div className={styles.editorContainer}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Version History</h2>
          </div>
          <VersionList />
        </div>
        <div className={styles.editor}>
          <YamlEditor />
        </div>
      </div>

      <Toaster />
    </div>
  )
}
