'use client'

import { useTheme } from 'next-themes'
import App from '../../../../../yaml-editor/App'
import styles from './page.module.css'

export default function YamlEditorPage() {
  const { theme } = useTheme()

  return (
    <div className={styles.yamlEditorPageInContent} data-theme={theme}>
      <div className={styles.yamlEditorContainer}>
        <App />
      </div>
    </div>
  )
}
