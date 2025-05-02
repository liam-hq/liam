'use client'

import type React from 'react'
import type { FC } from 'react'
import styles from './OverrideEditor.module.css'
import { useYamlEditor } from './useYamlEditor'

interface OverrideEditorProps {
  doc: string | undefined
  setDoc: React.Dispatch<React.SetStateAction<string | undefined>>
}

export const OverrideEditor: FC<OverrideEditorProps> = ({ doc, setDoc }) => {
  const { editor } = useYamlEditor({ doc, setDoc })

  return <div ref={editor} className={styles.wrapper} />
}
