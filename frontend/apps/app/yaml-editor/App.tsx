'use client'

import { Toaster } from '@/components/ui/toaster'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { VersionList } from './VersionList'
import { YamlEditor } from './YamlEditor'
import styles from './YamlEditor.module.css'
import { useVersionStore } from './versionStore'

export default function App() {
  const { initializeStore } = useVersionStore()
  const { theme } = useTheme()

  useEffect(() => {
    // Initialize with a sample YAML document
    initializeStore()
  }, [initializeStore])

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
