'use client'

import { type FC, useState } from 'react'
import styles from './OverrideEditor.module.css'
import { useYamlEditor } from './useYamlEditor'

export const OverrideEditor: FC = () => {
  const [doc, setDoc] = useState<string | undefined>(undefined)

  const { editor } = useYamlEditor({ doc, setDoc })

  return <div ref={editor} className={styles.wrapper} />
}
